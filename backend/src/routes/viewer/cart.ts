// Viewer cart routes
import { Router, Response } from 'express';
import * as cartService from '../../domains/cart/service.js';
import type {
  AddToCartRequest,
  UpdateCartItemRequest,
} from '../../domains/cart/types.js';
import { requireSession } from '../../domains/auth/session.js';
import { tenantMiddleware, getTenantContext } from '../../shared/middleware/tenant.js';
import { ok, created, noContent, badRequest } from '../../shared/utils/response.js';
import type { AppRequest } from '../../shared/types/index.js';
import { asyncHandler } from '@/shared/index.js';

const router = Router();

// Apply middleware
router.use(requireSession);
router.use(tenantMiddleware);

// Get cart
router.get('/', asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  const cart = await cartService.getCart(tenant.appId, tenant.tenantId, tenant.userId);
  ok(res, cart);
}));

// Get cart summary only
router.get('/summary', asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  const summary = await cartService.getCartSummary(tenant.appId, tenant.tenantId, tenant.userId);
  ok(res, summary);
}));

// Add item to cart
router.post('/items', asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  const data: AddToCartRequest = req.body;

  if (!data.ticket_id) {
    return badRequest(res, 'Ticket ID is required');
  }
  if (!data.quantity || data.quantity <= 0) {
    return badRequest(res, 'Quantity must be greater than 0');
  }
  if (data.unit_price === undefined || data.unit_price < 0) {
    return badRequest(res, 'Unit price is required');
  }

  const cart = await cartService.addToCart(tenant.appId, tenant.tenantId, tenant.userId, data);
  created(res, cart, 'Item added to cart');
}));

// Update cart item
router.put('/items/:ticketId', asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  const ticketId = parseInt(req.params.ticketId, 10);

  if (isNaN(ticketId)) {
    return badRequest(res, 'Invalid ticket ID');
  }

  const data: UpdateCartItemRequest = req.body;

  if (data.quantity === undefined) {
    return badRequest(res, 'Quantity is required');
  }

  const cart = await cartService.updateCartItem(
    tenant.appId,
    tenant.tenantId,
    tenant.userId,
    ticketId,
    data
  );
  ok(res, cart, 'Cart item updated');
}));

// Remove item from cart
router.delete('/items/:ticketId', asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  const ticketId = parseInt(req.params.ticketId, 10);

  if (isNaN(ticketId)) {
    return badRequest(res, 'Invalid ticket ID');
  }

  const cart = await cartService.removeFromCart(tenant.appId, tenant.tenantId, tenant.userId, ticketId);
  ok(res, cart, 'Item removed from cart');
}));

// Clear cart
router.delete('/', asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  await cartService.clearCart(tenant.appId, tenant.tenantId, tenant.userId);
  noContent(res);
}));

// Apply coupon
router.post('/coupons', asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  const { coupon_code } = req.body;

  if (!coupon_code) {
    return badRequest(res, 'Coupon code is required');
  }

  const cart = await cartService.applyCoupon(tenant.appId, tenant.tenantId, tenant.userId, coupon_code);
  ok(res, cart, 'Coupon applied');
}));

// Remove coupon
router.delete('/coupons/:couponCode', asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  const couponCode = req.params.couponCode;

  const cart = await cartService.removeCoupon(tenant.appId, tenant.tenantId, tenant.userId, couponCode);
  ok(res, cart, 'Coupon removed');
}));

export const cartRoutes: Router = router;

