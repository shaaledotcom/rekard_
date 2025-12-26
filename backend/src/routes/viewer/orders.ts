// Viewer orders routes (user's own orders)
import { Router, Response } from 'express';
import * as ordersService from '../../domains/orders/service.js';
import type {
  CreateOrderRequest,
  CreateUserAndOrderRequest,
  PaginationParams,
} from '../../domains/orders/types.js';
import { requireSession } from '../../domains/auth/session.js';
import { tenantMiddleware, getTenantContext } from '../../shared/middleware/tenant.js';
import { ok, created, badRequest } from '../../shared/utils/response.js';
import type { AppRequest } from '../../shared/types/index.js';
import { asyncHandler } from '@/shared/index.js';

const router = Router();

// ===== Public routes (no auth required) =====

// Create user and order (purchase without login)
router.post('/create', tenantMiddleware, asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  const data: CreateUserAndOrderRequest = req.body;

  if (!data.email) {
    return badRequest(res, 'Email is required');
  }
  if (!data.ticket_id) {
    return badRequest(res, 'Ticket ID is required');
  }
  if (!data.quantity || data.quantity <= 0) {
    return badRequest(res, 'Quantity must be greater than 0');
  }
  if (data.unit_price === undefined || data.unit_price < 0) {
    return badRequest(res, 'Unit price is required');
  }

  const result = await ordersService.createUserAndOrder(tenant.appId, tenant.tenantId, data);
  created(res, result, 'User and order created successfully');
}));

// Complete order after payment
router.post('/complete', tenantMiddleware, asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  const { order_id, payment_id, user_id } = req.body;

  if (!order_id) {
    return badRequest(res, 'Order ID is required');
  }
  if (!payment_id) {
    return badRequest(res, 'Payment ID is required');
  }

  const order = await ordersService.completeOrderFromPayment(
    tenant.appId,
    tenant.tenantId,
    order_id,
    payment_id,
    user_id
  );

  ok(res, {
    order_id: order.id,
    payment_id,
    status: order.status,
  }, 'Order completed successfully');
}));

// Validate coupon for purchase without login
router.post('/validate-coupon', tenantMiddleware, asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  const { coupon_code, ticket_id, order_amount } = req.body;

  if (!coupon_code) {
    return badRequest(res, 'Coupon code is required');
  }
  if (!ticket_id) {
    return badRequest(res, 'Ticket ID is required');
  }
  if (order_amount === undefined || order_amount <= 0) {
    return badRequest(res, 'Order amount must be greater than 0');
  }

  const result = await ordersService.validateCoupon(
    tenant.appId,
    tenant.tenantId,
    coupon_code,
    ticket_id,
    order_amount
  );
  ok(res, result);
}));

// ===== Protected routes (auth required) =====
router.use(requireSession);
router.use(tenantMiddleware);

// Get user purchase status for a ticket
router.get('/purchase-status/:ticketId', asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  const ticketId = parseInt(req.params.ticketId, 10);

  if (isNaN(ticketId)) {
    return badRequest(res, 'Invalid ticket ID');
  }

  const status = await ordersService.checkUserPurchaseStatus(
    tenant.appId,
    tenant.tenantId,
    tenant.userId,
    ticketId
  );
  ok(res, status);
}));

// Get watch link for a purchased ticket
router.get('/watch-link/:ticketId', asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  const ticketId = parseInt(req.params.ticketId, 10);

  if (isNaN(ticketId)) {
    return badRequest(res, 'Invalid ticket ID');
  }

  const watchLink = await ordersService.getWatchLink(
    tenant.appId,
    tenant.tenantId,
    tenant.userId,
    ticketId
  );
  ok(res, watchLink);
}));

// Get user's purchases (completed orders)
router.get('/my-purchases', asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);

  const pagination: PaginationParams = {
    page: parseInt(req.query.page as string, 10) || 1,
    page_size: parseInt(req.query.page_size as string, 10) || 10,
  };

  const result = await ordersService.getMyPurchases(
    tenant.appId,
    tenant.tenantId,
    tenant.userId,
    pagination
  );
  ok(res, result);
})) ;

// List user's orders
router.get('/', asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);

  const pagination: PaginationParams = {
    page: parseInt(req.query.page as string, 10) || 1,
    page_size: parseInt(req.query.page_size as string, 10) || 10,
  };

  const result = await ordersService.listUserOrders(
    tenant.appId,
    tenant.tenantId,
    tenant.userId,
    pagination
  );
  ok(res, result);
}));

// Get order by ID
router.get('/:id', asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  const orderId = parseInt(req.params.id, 10);

  if (isNaN(orderId)) {
    return badRequest(res, 'Invalid order ID');
  }

  const order = await ordersService.getUserOrder(
    tenant.appId,
    tenant.tenantId,
    tenant.userId,
    orderId
  );
  ok(res, order);
}));

// Create order (purchase ticket)
router.post('/', asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  const data: CreateOrderRequest = req.body;

  if (!data.ticket_id) {
    return badRequest(res, 'Ticket ID is required');
  }
  if (!data.quantity || data.quantity <= 0) {
    return badRequest(res, 'Quantity must be greater than 0');
  }
  if (data.unit_price === undefined || data.unit_price < 0) {
    return badRequest(res, 'Unit price is required');
  }

  const order = await ordersService.createOrder(
    tenant.appId,
    tenant.tenantId,
    tenant.userId,
    data
  );
  created(res, order, 'Order created successfully');
}));

// Cancel order (user can only cancel pending orders)
router.post('/:id/cancel', asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  const orderId = parseInt(req.params.id, 10);

  if (isNaN(orderId)) {
    return badRequest(res, 'Invalid order ID');
  }

  // Verify the order belongs to the user
  const existingOrder = await ordersService.getUserOrder(
    tenant.appId,
    tenant.tenantId,
    tenant.userId,
    orderId
  );

  // Only allow cancelling pending orders
  if (existingOrder.status !== 'pending') {
    return badRequest(res, 'Only pending orders can be cancelled');
  }

  const order = await ordersService.cancelOrder(tenant.appId, tenant.tenantId, orderId);
  ok(res, order, 'Order cancelled successfully');
}));

export const ordersRoutes: Router = router;

