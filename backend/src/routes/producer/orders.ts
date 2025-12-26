// Producer orders routes (admin view)
import { Router, Response } from 'express';
import * as ordersService from '../../domains/orders/service.js';
import type {
  UpdateOrderRequest,
  OrderFilter,
  PaginationParams,
  SortParams,
} from '../../domains/orders/types.js';
import { requireSession } from '../../domains/auth/session.js';
import { requireRole } from '../../domains/auth/roles.js';
import { tenantMiddleware, getTenantContext } from '../../shared/middleware/tenant.js';
import { ok, okList, badRequest } from '../../shared/utils/response.js';
import type { AppRequest } from '../../shared/types/index.js';
import { ROLE_PRODUCER } from '../../domains/auth/constants.js';
import { asyncHandler } from '@/shared/index.js';

const router = Router();

// Apply middleware
router.use(requireSession);
router.use(tenantMiddleware);
// router.use(requireRole(ROLE_PRODUCER));

// List orders
router.get('/', asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);

  const filter: OrderFilter = {
    status: req.query.status as OrderFilter['status'],
    customer_email: req.query.customer_email as string,
    ticket_id: req.query.ticket_id ? parseInt(req.query.ticket_id as string, 10) : undefined,
    event_id: req.query.event_id ? parseInt(req.query.event_id as string, 10) : undefined,
    start_date: req.query.start_date ? new Date(req.query.start_date as string) : undefined,
    end_date: req.query.end_date ? new Date(req.query.end_date as string) : undefined,
  };

  const pagination: PaginationParams = {
    page: parseInt(req.query.page as string, 10) || 1,
    page_size: parseInt(req.query.page_size as string, 10) || 10,
  };

  const sort: SortParams = {
    sort_by: req.query.sort_by as string,
    sort_order: (req.query.sort_order as 'asc' | 'desc') || 'desc',
  };

  const result = await ordersService.listOrders(tenant.appId, tenant.tenantId, filter, pagination, sort);
  okList(res, result);
})) ;

// Get order by ID
router.get('/:id', asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  const orderId = parseInt(req.params.id, 10);

  if (isNaN(orderId)) {
    return badRequest(res, 'Invalid order ID');
  }

  const order = await ordersService.getOrderWithDetails(tenant.appId, tenant.tenantId, orderId);
  ok(res, order);
}));

// Get order by number
router.get('/by-number/:orderNumber', asyncHandler(async (req: AppRequest, res: Response) => {
  const orderNumber = req.params.orderNumber;
  const order = await ordersService.getOrderByNumber(orderNumber);
  ok(res, order);
}));

// Update order
router.put('/:id', asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  const orderId = parseInt(req.params.id, 10);

  if (isNaN(orderId)) {
    return badRequest(res, 'Invalid order ID');
  }

  const data: UpdateOrderRequest = req.body;
  const order = await ordersService.updateOrder(tenant.appId, tenant.tenantId, orderId, data);
  ok(res, order, 'Order updated successfully');
}));

// Complete order
router.post('/:id/complete', asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  const orderId = parseInt(req.params.id, 10);
  const { payment_id } = req.body;

  if (isNaN(orderId)) {
    return badRequest(res, 'Invalid order ID');
  }

  const order = await ordersService.completeOrder(tenant.appId, tenant.tenantId, orderId, payment_id);
  ok(res, order, 'Order completed successfully');
}));

// Cancel order
router.post('/:id/cancel', asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  const orderId = parseInt(req.params.id, 10);

  if (isNaN(orderId)) {
    return badRequest(res, 'Invalid order ID');
  }

  const order = await ordersService.cancelOrder(tenant.appId, tenant.tenantId, orderId);
  ok(res, order, 'Order cancelled successfully');
}));

// Refund order
router.post('/:id/refund', asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  const orderId = parseInt(req.params.id, 10);

  if (isNaN(orderId)) {
    return badRequest(res, 'Invalid order ID');
  }

  const order = await ordersService.refundOrder(tenant.appId, tenant.tenantId, orderId);
  ok(res, order, 'Order refunded successfully');
}));

// Get order statistics
router.get('/stats/summary', asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  const startDate = req.query.start_date ? new Date(req.query.start_date as string) : undefined;
  const endDate = req.query.end_date ? new Date(req.query.end_date as string) : undefined;

  const stats = await ordersService.getOrderStats(tenant.appId, tenant.tenantId, startDate, endDate);
  ok(res, stats);
}));

export const ordersRoutes: Router = router;
