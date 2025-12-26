// Razorpay payment routes
import { Router, Response, Request } from 'express';
import * as razorpay from '../../domains/payments/razorpay.js';
import { requireSession } from '../../domains/auth/session.js';
import { tenantMiddleware } from '../../shared/middleware/tenant.js';
import { ok, created, badRequest } from '../../shared/utils/response.js';
import type { AppRequest } from '../../shared/types/index.js';
import { log } from '../../shared/middleware/logger.js';
import { asyncHandler } from '@/shared/index.js';

const router = Router();

// Create payment order (requires auth)
router.post(
  '/create-order',
  requireSession,
  tenantMiddleware,
  asyncHandler(async (req: AppRequest, res: Response) => {
    const { amount, currency, receipt, notes } = req.body;

    if (!amount || amount <= 0) {
      return badRequest(res, 'Valid amount is required');
    }

    const order = await razorpay.createOrder({
      amount: Math.round(amount), // Amount already in paise from frontend
      currency: currency || 'INR',
      receipt: receipt || `rcpt_${Date.now()}`,
      notes: notes || {},
    });

    created(res, order, 'Payment order created');
  }
));

// Verify payment (requires auth)
router.post(
  '/verify',
  requireSession,
  tenantMiddleware,
  asyncHandler(async (req: AppRequest, res: Response) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return badRequest(res, 'Missing payment verification parameters');
    }

    const secret = razorpay.getKeySecret();
    const isValid = razorpay.verifyPayment({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    }, secret);

    if (!isValid) {
      return badRequest(res, 'Payment verification failed');
    }

    ok(res, { verified: true }, 'Payment verified successfully');
  }
));

// Webhook (no auth - verified by signature)
router.post('/webhook', asyncHandler(async (req: Request, res: Response) => {
  const signature = req.headers['x-razorpay-signature'] as string;

  if (!signature) {
    log.warn('Razorpay webhook missing signature');
    res.status(400).json({ success: false, error: 'Missing signature' });
    return;
  }

  try {
    const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    const secret = razorpay.getWebhookSecret();
    const isValid = razorpay.verifyWebhookSignature(body, signature, secret);

    if (!isValid) {
      log.warn('Razorpay webhook signature verification failed');
      res.status(400).json({ success: false, error: 'Invalid signature' });
      return;
    }

    const event = razorpay.parseWebhookEvent(body, signature, secret);

    if (!event) {
      log.warn('Failed to parse webhook event');
      res.status(400).json({ success: false, error: 'Invalid event' });
      return;
    }

    // Handle different event types
    log.info(`Received Razorpay webhook: ${event.event}`);

    switch (event.event) {
      case 'payment.captured': {
        const payment = razorpay.extractPaymentFromPayload(event.payload);
        log.info(`Payment captured: ${payment?.id}`);
        break;
      }

      case 'payment.failed': {
        const payment = razorpay.extractPaymentFromPayload(event.payload);
        log.warn(`Payment failed: ${payment?.id}`);
        break;
      }

      case 'order.paid':
        log.info(`Order paid`);
        break;

      case 'refund.created': {
        const refund = razorpay.extractRefundFromPayload(event.payload);
        log.info(`Refund created: ${refund?.id}`);
        break;
      }

      default:
        log.info(`Unhandled webhook event: ${event.event}`);
    }

    res.status(200).json({ success: true });
  } catch (err) {
    log.error(`Razorpay webhook error: ${err}`);
    res.status(500).json({ success: false, error: 'Webhook processing failed' });
  }
}));

export const razorpayRoutes: Router = router;
