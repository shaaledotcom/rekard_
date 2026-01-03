// Producer billing routes
import { Router, Response } from 'express';
import * as billingService from '../../domains/billing/service.js';
import type {
  BillingPlanFilter,
  PaginationParams,
  SortParams,
  WalletTransactionFilter,
  InvoiceFilter,
  PurchasePlanRequest,
  SalesReportFilter,
} from '../../domains/billing/types.js';
import { requireSession } from '../../domains/auth/session.js';
import { tenantMiddleware, getTenantContext } from '../../shared/middleware/tenant.js';
import { ok, okList, created, noContent, badRequest, notFound } from '../../shared/utils/response.js';
import type { AppRequest } from '../../shared/types/index.js';
import { asyncHandler } from '../../shared/index.js';

const router = Router();

// Apply middleware
router.use(requireSession);
router.use(tenantMiddleware);
// router.use(requireRole(ROLE_PRODUCER));

// ===== Billing Plans =====
router.get('/plans', asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);

  const filter: BillingPlanFilter = {
    is_active: req.query.is_active === 'true' ? true : req.query.is_active === 'false' ? false : undefined,
    is_public: req.query.is_public === 'true' ? true : req.query.is_public === 'false' ? false : undefined,
  };

  const pagination: PaginationParams = {
    page: parseInt(req.query.page as string, 10) || 1,
    page_size: parseInt(req.query.page_size as string, 10) || 10,
  };

  const sort: SortParams = {
    sort_by: req.query.sort_by as string || 'sort_order',
    sort_order: (req.query.sort_order as 'asc' | 'desc') || 'asc',
  };

  const result = await billingService.getPlans(tenant.appId, tenant.tenantId, filter, pagination, sort);
  okList(res, result);
}));

router.get('/plans/:id', asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  const planId = parseInt(req.params.id, 10);

  if (isNaN(planId)) {
    return badRequest(res, 'Invalid plan ID');
  }

  const plan = await billingService.getPlanById(tenant.appId, tenant.tenantId, planId);
  if (!plan) {
    return notFound(res, 'Billing plan not found');
  }
  ok(res, plan);
}));

router.post('/plans', asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  const { name, price, initial_tickets } = req.body;

  // Validate required fields
  if (!name || typeof name !== 'string') {
    return badRequest(res, 'name is required');
  }
  if (price === undefined || typeof price !== 'number') {
    return badRequest(res, 'price is required and must be a number');
  }
  if (initial_tickets === undefined || typeof initial_tickets !== 'number') {
    return badRequest(res, 'initial_tickets is required and must be a number');
  }

  const plan = await billingService.createPlan(tenant.appId, tenant.tenantId, req.body);
  created(res, plan, 'Billing plan created');
}));

router.put('/plans/:id', asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  const planId = parseInt(req.params.id, 10);

  if (isNaN(planId)) {
    return badRequest(res, 'Invalid plan ID');
  }

  const plan = await billingService.updatePlan(tenant.appId, tenant.tenantId, planId, req.body);
  if (!plan) {
    return notFound(res, 'Billing plan not found');
  }
  ok(res, plan, 'Billing plan updated');
}));

router.delete('/plans/:id', asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  const planId = parseInt(req.params.id, 10);

  if (isNaN(planId)) {
    return badRequest(res, 'Invalid plan ID');
  }

  await billingService.deletePlan(tenant.appId, tenant.tenantId, planId);
  noContent(res);
}));

// ===== User Wallet (producer's own wallet) =====
router.get('/wallet', asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  const wallet = await billingService.getWallet(tenant.appId, tenant.tenantId, tenant.userId);
  ok(res, wallet);
})) ;

router.get('/wallet/transactions', asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);

  const filter: WalletTransactionFilter = {
    user_id: tenant.userId,
    transaction_type: req.query.type as WalletTransactionFilter['transaction_type'],
  };

  const pagination: PaginationParams = {
    page: parseInt(req.query.page as string, 10) || 1,
    page_size: parseInt(req.query.page_size as string, 10) || 10,
  };

  const transactions = await billingService.getTransactions(
    tenant.appId,
    tenant.tenantId,
    filter,
    pagination
  );
  okList(res, transactions);
}));

// Get ticket pricing based on quantity
router.get('/wallet/ticket-pricing', asyncHandler(async (req: AppRequest, res: Response) => {
  const quantity = parseInt(req.query.quantity as string, 10) || 1;
  const currency = (req.query.currency as string) || 'INR';

  const unitPrice = billingService.getTicketUnitPrice(quantity);
  const totalPrice = unitPrice * quantity;

  ok(res, {
    quantity,
    unit_price: unitPrice,
    total_price: totalPrice,
    currency,
    pricing_tiers: [
      { min_quantity: 1, max_quantity: 99, unit_price: 30 },
      { min_quantity: 100, max_quantity: 499, unit_price: 25 },
      { min_quantity: 500, max_quantity: 999, unit_price: 20 },
      { min_quantity: 1000, max_quantity: Infinity, unit_price: 15 },
    ],
  });
}));

// Purchase tickets
router.post('/wallet/purchase-tickets', asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  const { quantity } = req.body;

  // Validate required fields
  if (quantity === undefined || typeof quantity !== 'number') {
    return badRequest(res, 'quantity is required and must be a number');
  }
  if (quantity <= 0) {
    return badRequest(res, 'quantity must be greater than 0');
  }

  const invoice = await billingService.purchaseTickets(
    tenant.appId,
    tenant.tenantId,
    tenant.userId,
    req.body
  );
  created(res, invoice, 'Tickets purchased successfully');
}));

// Consume tickets
router.post('/wallet/consume-tickets', asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  const { quantity, reference_type, reference_id } = req.body;

  // Validate required fields
  if (quantity === undefined || typeof quantity !== 'number') {
    return badRequest(res, 'quantity is required and must be a number');
  }
  if (!reference_type || typeof reference_type !== 'string') {
    return badRequest(res, 'reference_type is required');
  }
  if (!reference_id || typeof reference_id !== 'string') {
    return badRequest(res, 'reference_id is required');
  }

  try {
    const result = await billingService.consumeTickets(
      tenant.appId,
      tenant.tenantId,
      tenant.userId,
      req.body
    );
    ok(res, result, 'Tickets consumed successfully');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to consume tickets';
    return badRequest(res, message);
  }
}));

// Get wallet allocations
router.get('/wallet/allocations', asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);

  const filter = {
    ticket_id: req.query.ticket_id ? parseInt(req.query.ticket_id as string, 10) : undefined,
    status: req.query.status as string,
  };

  const pagination: PaginationParams = {
    page: parseInt(req.query.page as string, 10) || 1,
    page_size: parseInt(req.query.page_size as string, 10) || 10,
  };

  const allocations = await billingService.getAllocations(
    tenant.appId,
    tenant.tenantId,
    tenant.userId,
    filter,
    pagination
  );
  okList(res, allocations);
}));

// Allocate tickets for publishing
router.post('/wallet/allocate-tickets', asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  const { ticket_id, quantity } = req.body;

  if (!ticket_id || !quantity) {
    return badRequest(res, 'ticket_id and quantity are required');
  }

  try {
    const result = await billingService.allocateTickets(
      tenant.appId,
      tenant.tenantId,
      tenant.userId,
      ticket_id,
      quantity
    );

    ok(res, result, 'Tickets allocated successfully');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to allocate tickets';
    return badRequest(res, message);
  }
}));

// Update ticket allocation
router.post('/wallet/update-allocation', asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  const { ticket_id, quantity } = req.body;

  if (!ticket_id || quantity === undefined) {
    return badRequest(res, 'ticket_id and quantity are required');
  }

  try {
    const result = await billingService.updateAllocation(
      tenant.appId,
      tenant.tenantId,
      tenant.userId,
      ticket_id,
      quantity
    );

    ok(res, result, 'Allocation updated');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update allocation';
    return badRequest(res, message);
  }
}));

// Release ticket allocation
router.post('/wallet/release-allocation', asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  const ticketId = parseInt(req.query.ticket_id as string, 10);

  if (isNaN(ticketId)) {
    return badRequest(res, 'ticket_id is required');
  }

  try {
    const result = await billingService.releaseAllocation(
      tenant.appId,
      tenant.tenantId,
      tenant.userId,
      ticketId
    );

    ok(res, result, 'Allocation released');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to release allocation';
    return badRequest(res, message);
  }
}));

// ===== Subscriptions =====
router.get('/subscriptions/active', asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  const subscription = await billingService.getSubscription(tenant.appId, tenant.tenantId, tenant.userId);
  ok(res, subscription);
}));

// Renew subscription
router.post('/subscription/renew', asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  
  // Get current subscription and renew it by purchasing the same plan again
  const subscription = await billingService.getSubscription(tenant.appId, tenant.tenantId, tenant.userId);
  if (!subscription) {
    return badRequest(res, 'No active subscription to renew');
  }

  const result = await billingService.purchasePlan(
    tenant.appId,
    tenant.tenantId,
    tenant.userId,
    { plan_id: subscription.plan_id }
  );

  ok(res, result, 'Subscription renewed successfully');
}));

// Cancel subscription
router.post('/subscription/cancel', asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  const immediate = req.body.immediate === true;

  const cancelled = await billingService.cancelSubscription(
    tenant.appId,
    tenant.tenantId,
    tenant.userId,
    immediate
  );

  if (cancelled) {
    ok(res, { cancelled: true }, 'Subscription cancelled successfully');
  } else {
    badRequest(res, 'Failed to cancel subscription');
  }
}));

// Purchase plan
router.post('/plans/:id/purchase', asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  const planId = parseInt(req.params.id, 10);

  if (isNaN(planId)) {
    return badRequest(res, 'Invalid plan ID');
  }

  // Verify plan exists before attempting purchase
  const plan = await billingService.getPlanById(tenant.appId, tenant.tenantId, planId);
  if (!plan) {
    return notFound(res, 'Billing plan not found');
  }

  const request: PurchasePlanRequest = {
    plan_id: planId,
    external_payment_id: req.body.payment_id,
  };

  try {
    const result = await billingService.purchasePlan(
      tenant.appId,
      tenant.tenantId,
      tenant.userId,
      request
    );
    ok(res, result, 'Plan purchased successfully');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to purchase plan';
    return badRequest(res, message);
  }
}));

// ===== Invoices =====
router.get('/invoices', asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);

  const filter: InvoiceFilter = {
    user_id: tenant.userId,
    status: req.query.status as InvoiceFilter['status'],
  };

  const pagination: PaginationParams = {
    page: parseInt(req.query.page as string, 10) || 1,
    page_size: parseInt(req.query.page_size as string, 10) || 10,
  };

  const invoices = await billingService.getInvoices(
    tenant.appId,
    tenant.tenantId,
    filter,
    pagination
  );
  okList(res, invoices);
}));

router.get('/invoices/:id', asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  const invoiceId = parseInt(req.params.id, 10);

  if (isNaN(invoiceId)) {
    return badRequest(res, 'Invalid invoice ID');
  }

  const invoice = await billingService.getInvoiceById(tenant.appId, tenant.tenantId, invoiceId);
  if (!invoice) {
    return notFound(res, 'Invoice not found');
  }
  ok(res, invoice);
}));

// ===== Features =====
router.get('/features', asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  
  // Get user's subscription to determine features
  const subscription = await billingService.getSubscription(tenant.appId, tenant.tenantId, tenant.userId);
  
  if (subscription?.plan?.features) {
    ok(res, subscription.plan.features);
  } else {
    // Return default/free tier features
    ok(res, []);
  }
}));

// ===== Ticket Buyers (users who purchased producer's tickets) =====
router.get('/ticket-buyers', asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  const limit = parseInt(req.query.limit as string, 10) || 50;
  const paginationToken = req.query.pagination_token as string;

  try {
    const result = await billingService.getTicketBuyers(
      tenant.appId,
      tenant.tenantId,
      tenant.userId,
      limit,
      paginationToken
    );

    ok(res, {
      users: result.buyers,
      next_pagination_token: result.next_pagination_token,
    });
  } catch (err) {
    // Return empty result if table doesn't exist or other DB error
    ok(res, {
      users: [],
      next_pagination_token: null,
    });
  }
}));

// ===== Bulk Email Access =====
router.post('/bulk-email-access', asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  const { user_emails, ticket_id, event_id, quantity } = req.body;

  if (!user_emails || !Array.isArray(user_emails) || user_emails.length === 0) {
    return badRequest(res, 'user_emails array is required');
  }

  if (!ticket_id || !quantity) {
    return badRequest(res, 'ticket_id and quantity are required');
  }

  const result = await billingService.grantBulkEmailAccess(
    tenant.appId,
    tenant.tenantId,
    tenant.userId,
    user_emails,
    ticket_id,
    quantity,
    event_id
  );

  ok(res, result, 'Access granted successfully');
}));

// Get email access status
router.get('/email-access-status', asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  const emails = (req.query.emails as string)?.split(',').map(e => e.trim()) || [];
  const ticketId = parseInt(req.query.ticket_id as string, 10);

  if (emails.length === 0 || isNaN(ticketId)) {
    return badRequest(res, 'emails and ticket_id are required');
  }

  try {
    const statuses = await billingService.getEmailAccessStatuses(
      tenant.appId,
      tenant.tenantId,
      emails,
      ticketId
    );

    ok(res, {
      statuses: statuses.map(s => ({
        ...s,
        ticket_id: ticketId,
      })),
    });
  } catch (err) {
    // Return statuses with has_access: false if table doesn't exist
    ok(res, {
      statuses: emails.map(email => ({
        email,
        has_access: false,
        quantity: 0,
        ticket_id: ticketId,
      })),
    });
  }
}));

// Sales Report - combines purchased orders and granted access
router.get('/sales-report', asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);

  const filter: SalesReportFilter = {
    type: (req.query.type as 'purchased' | 'granted' | 'all') || 'all',
    ticket_id: req.query.ticket_id ? parseInt(req.query.ticket_id as string, 10) : undefined,
    user_email: req.query.user_email as string,
    start_date: req.query.start_date ? new Date(req.query.start_date as string) : undefined,
    end_date: req.query.end_date ? new Date(req.query.end_date as string) : undefined,
  };

  const pagination: PaginationParams = {
    page: parseInt(req.query.page as string, 10) || 1,
    page_size: parseInt(req.query.page_size as string, 10) || 20,
  };

  const sort: SortParams = {
    sort_by: req.query.sort_by as string,
    sort_order: (req.query.sort_order as 'asc' | 'desc') || 'desc',
  };

  const result = await billingService.getSalesReport(
    tenant.appId,
    tenant.tenantId,
    filter,
    pagination,
    sort
  );
  okList(res, result);
}));

export const billingRoutes: Router = router;
