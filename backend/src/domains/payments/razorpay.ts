// Razorpay payment service
import crypto from 'crypto';
import Razorpay from 'razorpay';
import type {
  CreateOrderRequest,
  CreateOrderResponse,
  PaymentVerificationRequest,
  PaymentCaptureRequest,
  RefundRequest,
  WebhookEvent,
  RazorpayPayment,
  RazorpayRefund,
  RazorpayConfig,
} from './types.js';
import { log } from '../../shared/middleware/logger.js';

let razorpayClient: Razorpay | null = null;
let webhookSecret: string = '';
let keySecret: string = '';

// Initialize Razorpay client
export const initRazorpay = (config: RazorpayConfig): void => {
  razorpayClient = new Razorpay({
    key_id: config.key_id,
    key_secret: config.key_secret,
  });
  keySecret = config.key_secret;
  webhookSecret = config.webhook_secret;
  log.info('Razorpay client initialized');
};

const getClient = (): Razorpay => {
  if (!razorpayClient) {
    throw new Error('Razorpay client not initialized');
  }
  return razorpayClient;
};

// Generate HMAC signature
const generateSignature = (data: string, secret: string): string => {
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
};

// Create payment order
export const createOrder = async (
  request: CreateOrderRequest
): Promise<CreateOrderResponse> => {
  const client = getClient();

  try {
    const order = await client.orders.create({
      amount: request.amount,
      currency: request.currency,
      receipt: request.receipt,
      notes: request.notes as Record<string, string> | undefined,
    });

    log.info(`Created Razorpay order: ${order.id}`);

    return {
      id: order.id,
      entity: order.entity,
      amount: Number(order.amount),
      amount_paid: Number(order.amount_paid),
      amount_due: Number(order.amount_due),
      currency: order.currency,
      receipt: order.receipt || request.receipt,
      status: order.status,
      notes: (order.notes as Record<string, unknown>) || {},
      created_at: Number(order.created_at),
    };
  } catch (error) {
    log.error('Failed to create Razorpay order', { error });
    throw new Error(`Failed to create order: ${(error as Error).message}`);
  }
};

// Verify payment signature
export const verifyPayment = (
  request: PaymentVerificationRequest,
  secret: string
): boolean => {
  const text = `${request.razorpay_order_id}|${request.razorpay_payment_id}`;
  const expectedSignature = generateSignature(text, secret);

  const isValid = expectedSignature === request.razorpay_signature;
  if (!isValid) {
    log.warn('Payment signature verification failed', {
      order_id: request.razorpay_order_id,
      payment_id: request.razorpay_payment_id,
    });
  }
  return isValid;
};

// Capture payment
export const capturePayment = async (
  request: PaymentCaptureRequest
): Promise<RazorpayPayment> => {
  const client = getClient();

  try {
    const payment = await client.payments.capture(
      request.payment_id,
      request.amount,
      request.currency
    );
    log.info(`Captured payment: ${request.payment_id}`);
    return payment as unknown as RazorpayPayment;
  } catch (error) {
    log.error('Failed to capture payment', { error, payment_id: request.payment_id });
    throw new Error(`Failed to capture payment: ${(error as Error).message}`);
  }
};

// Fetch payment details
export const getPayment = async (paymentId: string): Promise<RazorpayPayment> => {
  const client = getClient();

  try {
    const payment = await client.payments.fetch(paymentId);
    return payment as unknown as RazorpayPayment;
  } catch (error) {
    log.error('Failed to fetch payment', { error, payment_id: paymentId });
    throw new Error(`Failed to fetch payment: ${(error as Error).message}`);
  }
};

// Create refund
export const createRefund = async (
  request: RefundRequest
): Promise<RazorpayRefund> => {
  const client = getClient();

  try {
    const refund = await client.payments.refund(request.payment_id, {
      amount: request.amount,
      speed: request.speed || 'normal',
      notes: request.notes as Record<string, string> | undefined,
    });
    log.info(`Created refund for payment: ${request.payment_id}`);
    return refund as unknown as RazorpayRefund;
  } catch (error) {
    log.error('Failed to create refund', { error, payment_id: request.payment_id });
    throw new Error(`Failed to create refund: ${(error as Error).message}`);
  }
};

// Fetch refund details
export const getRefund = async (
  paymentId: string,
  refundId: string
): Promise<RazorpayRefund> => {
  const client = getClient();

  try {
    const refund = await client.payments.fetchRefund(paymentId, refundId);
    return refund as unknown as RazorpayRefund;
  } catch (error) {
    log.error('Failed to fetch refund', { error, payment_id: paymentId, refund_id: refundId });
    throw new Error(`Failed to fetch refund: ${(error as Error).message}`);
  }
};

// Verify webhook signature
export const verifyWebhookSignature = (
  body: string | Buffer,
  signature: string,
  secret: string
): boolean => {
  const expectedSignature = generateSignature(
    typeof body === 'string' ? body : body.toString(),
    secret
  );
  return expectedSignature === signature;
};

// Parse webhook event
export const parseWebhookEvent = (
  body: string | Buffer,
  signature: string,
  secret: string
): WebhookEvent | null => {
  if (!verifyWebhookSignature(body, signature, secret)) {
    log.warn('Invalid webhook signature');
    return null;
  }

  try {
    const event = JSON.parse(typeof body === 'string' ? body : body.toString());
    return event as WebhookEvent;
  } catch (error) {
    log.error('Failed to parse webhook event', { error });
    return null;
  }
};

// Get webhook secret
export const getWebhookSecret = (): string => webhookSecret;

// Get key secret (for payment signature verification)
export const getKeySecret = (): string => keySecret;

// Extract payment from webhook payload
export const extractPaymentFromPayload = (
  payload: Record<string, unknown>
): RazorpayPayment | null => {
  const paymentEntity = payload.payment as Record<string, unknown> | undefined;
  if (!paymentEntity) return null;
  return (paymentEntity.entity || paymentEntity) as RazorpayPayment;
};

// Extract refund from webhook payload
export const extractRefundFromPayload = (
  payload: Record<string, unknown>
): RazorpayRefund | null => {
  const refundEntity = payload.refund as Record<string, unknown> | undefined;
  if (!refundEntity) return null;
  return (refundEntity.entity || refundEntity) as RazorpayRefund;
};
