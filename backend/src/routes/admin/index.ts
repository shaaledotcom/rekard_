// Admin routes - protected by ADMIN_API_KEY, no user session required
import { Router, Request, Response, NextFunction } from 'express';
import * as billingService from '../../domains/billing/service.js';
import * as tenantService from '../../domains/tenant/service.js';
import * as ticketsService from '../../domains/tickets/service.js';
import * as ordersService from '../../domains/orders/service.js';
import type { CreateTicketRequest, UpdateTicketRequest } from '../../domains/tickets/types.js';
import type { CreateOrderRequest } from '../../domains/orders/types.js';
import { getUserByEmail } from '../../domains/auth/user.js';
import { ok, created, badRequest, notFound, unauthorized } from '../../shared/utils/response.js';
import { asyncHandler } from '../../shared/index.js';
import { env } from '../../config/env.js';

const router = Router();

/** Middleware: require valid ADMIN_API_KEY in X-Admin-Key header */
const requireAdminKey = (req: Request, res: Response, next: NextFunction): void => {
  const adminKey = req.headers['x-admin-key'] as string;
  const expectedKey = env.security.adminApiKey;

  if (!expectedKey) {
    res.status(503).json({
      success: false,
      error: 'Admin API not configured',
      message: 'Set ADMIN_API_KEY in environment to enable admin endpoints',
    });
    return;
  }

  if (!adminKey || adminKey !== expectedKey) {
    unauthorized(res);
    return;
  }

  next();
};

router.use(requireAdminKey);

/**
 * POST /v1/admin/grant-plan
 * Grant Pro or Premium plan to a tenant (no payment required).
 *
 * Body: { tenant_id: string, plan_name: 'Pro' | 'Premium' }
 * Or:   { user_id: string, plan_name: 'Pro' | 'Premium' }  -- resolves tenant from user
 *
 * Use when: billing flow failed but user paid, or manual compensation.
 */
router.post(
  '/grant-plan',
  asyncHandler(async (req, res: Response) => {
    const { tenant_id, user_id, plan_name } = req.body;

    if (!plan_name || !['Pro', 'Premium'].includes(plan_name)) {
      badRequest(res, 'plan_name is required and must be "Pro" or "Premium"');
      return;
    }

    let tenantId: string | null = tenant_id;

    if (!tenantId && user_id) {
      const { tenant } = await tenantService.getOrCreateTenantForUser(user_id);
      tenantId = tenant.id;
    }

    if (!tenantId) {
      badRequest(res, 'Either tenant_id or user_id is required');
      return;
    }

    try {
      const result = await billingService.adminGrantPlan(tenantId, plan_name);
      ok(res, result, `${plan_name} plan granted successfully`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to grant plan';
      badRequest(res, message);
    }
  })
);

/**
 * GET /v1/admin/tenants?user_id=xxx
 * Lookup tenant by user_id (Supabase user UUID).
 * Helps find tenant_id when you only have user email/ID from Supabase.
 */
router.get(
  '/tenants',
  asyncHandler(async (req, res: Response) => {
    const user_id = req.query.user_id as string;
    if (!user_id) {
      badRequest(res, 'user_id query param is required');
      return;
    }

    const tenant = await tenantService.getTenantByUserId(user_id);
    if (!tenant) {
      notFound(res, `No tenant found for user_id: ${user_id}`);
      return;
    }

    ok(res, {
      tenant_id: tenant.id,
      user_id: tenant.user_id,
      app_id: tenant.app_id,
      is_pro: tenant.is_pro,
    });
  })
);

/**
 * GET /v1/admin/lookup?email=xxx
 * Lookup user_id and tenant by email (Supabase Auth).
 * Use when you only have the user's signup email.
 */
router.get(
  '/lookup',
  asyncHandler(async (req, res: Response) => {
    const email = req.query.email as string;
    if (!email) {
      badRequest(res, 'email query param is required');
      return;
    }

    const user = await getUserByEmail('', email);
    if (!user) {
      notFound(res, `No user found for email: ${email}`);
      return;
    }

    const tenant = await tenantService.getTenantByUserId(user.id);
    ok(res, {
      user_id: user.id,
      tenant_id: tenant?.id ?? null,
      app_id: tenant?.app_id ?? 'public',
      is_pro: tenant?.is_pro ?? false,
      has_tenant: !!tenant,
    });
  })
);

/**
 * POST /v1/admin/tenants/:tenant_id/orders
 * Create an order for a tenant (admin only). Use when a customer paid offline and you
 * sync by creating the order via API. Uses same validation and updates as viewer flow
 * (ticket must be published, availability, sold_quantity incremented).
 *
 * Body: { user_id (buyer Supabase user UUID), ticket_id, quantity, unit_price, currency?,
 *        event_id?, payment_method?, external_payment_id?, customer_email?, customer_name?,
 *        customer_phone?, billing_address?, metadata? }
 * Ticket must belong to the tenant. Buyer (user_id) must exist.
 */
router.post(
  '/tenants/:tenant_id/orders',
  asyncHandler(async (req, res: Response) => {
    const tenant_id = req.params.tenant_id as string;
    if (!tenant_id?.trim()) {
      badRequest(res, 'tenant_id path param is required');
      return;
    }

    const tenant = await tenantService.getTenantById(tenant_id);
    if (!tenant) {
      notFound(res, `No tenant found for tenant_id: ${tenant_id}`);
      return;
    }

    const body = req.body as CreateOrderRequest & { user_id: string };
    if (!body?.user_id || typeof body.user_id !== 'string' || !body.user_id.trim()) {
      badRequest(res, 'body.user_id is required (buyer Supabase user UUID)');
      return;
    }
    if (typeof body.ticket_id !== 'number' && typeof body.ticket_id !== 'string') {
      badRequest(res, 'body.ticket_id is required');
      return;
    }
    const ticketId = typeof body.ticket_id === 'string' ? parseInt(body.ticket_id, 10) : body.ticket_id;
    if (!Number.isInteger(ticketId) || ticketId < 1) {
      badRequest(res, 'body.ticket_id must be a positive integer');
      return;
    }
    if (typeof body.quantity !== 'number' || body.quantity <= 0) {
      badRequest(res, 'body.quantity is required and must be greater than 0');
      return;
    }
    if (typeof body.unit_price !== 'number' || body.unit_price < 0) {
      badRequest(res, 'body.unit_price is required and must be a non-negative number');
      return;
    }

    // Ensure ticket belongs to this tenant
    const ticket = await ticketsService.getTicket(tenant.app_id, tenant.id, ticketId, false);
    if (!ticket) {
      notFound(res, `Ticket ${ticketId} not found or does not belong to tenant ${tenant_id}`);
      return;
    }

    const orderData: CreateOrderRequest = {
      ticket_id: ticketId,
      event_id: body.event_id,
      quantity: body.quantity,
      unit_price: body.unit_price,
      currency: body.currency,
      payment_method: body.payment_method,
      external_payment_id: body.external_payment_id,
      customer_email: body.customer_email,
      customer_name: body.customer_name,
      customer_phone: body.customer_phone,
      billing_address: body.billing_address,
      metadata: body.metadata,
    };

    const order = await ordersService.createOrder(
      'public',
      tenant.id,
      body.user_id.trim(),
      orderData,
      null
    );
    created(res, order, 'Order created successfully');
  })
);

/**
 * POST /v1/admin/tenants/:tenant_id/tickets
 * Create a ticket for a tenant (admin only). Use when producer requested and paid
 * outside the app; you sync state by creating the ticket via API.
 *
 * Body: same as producer CreateTicketRequest (title, description?, url?, price, total_quantity,
 * currency?, max_quantity_per_user?, status?, event_ids?, coupons?, pricing?, sponsors?,
 * geoblocking_enabled?, geoblocking_countries?, watch_from?, watch_upto?, etc.)
 * All tables (tickets, ticket_events, ticket_coupons, ticket_pricing, ticket_sponsors) are updated.
 */
router.post(
  '/tenants/:tenant_id/tickets',
  asyncHandler(async (req, res: Response) => {
    const tenant_id = req.params.tenant_id as string;
    if (!tenant_id?.trim()) {
      badRequest(res, 'tenant_id path param is required');
      return;
    }

    const tenant = await tenantService.getTenantById(tenant_id);
    if (!tenant) {
      notFound(res, `No tenant found for tenant_id: ${tenant_id}`);
      return;
    }

    const body = req.body as CreateTicketRequest;
    if (!body || typeof body.title !== 'string' || body.title.trim() === '') {
      badRequest(res, 'body.title is required');
      return;
    }
    if (typeof body.price !== 'number' || body.price < 0) {
      badRequest(res, 'body.price is required and must be a non-negative number');
      return;
    }
    if (typeof body.total_quantity !== 'number' || body.total_quantity <= 0) {
      badRequest(res, 'body.total_quantity is required and must be greater than 0');
      return;
    }

    const ticket = await ticketsService.createTicket(tenant.app_id, tenant.id, body);
    created(res, ticket, 'Ticket created successfully');
  })
);

/**
 * PUT /v1/admin/tenants/:tenant_id/tickets/:id
 * Update a ticket for a tenant (admin only). Use when producer requested and paid
 * outside the app; you sync state by updating the ticket via API.
 *
 * Body: same as producer UpdateTicketRequest (all fields optional). Updates tickets table
 * and, when provided, ticket_events, ticket_coupons, ticket_pricing, ticket_sponsors.
 */
router.put(
  '/tenants/:tenant_id/tickets/:id',
  asyncHandler(async (req, res: Response) => {
    const tenant_id = req.params.tenant_id as string;
    const idParam = req.params.id;
    if (!tenant_id?.trim()) {
      badRequest(res, 'tenant_id path param is required');
      return;
    }
    const ticketId = parseInt(idParam, 10);
    if (!Number.isInteger(ticketId) || ticketId < 1) {
      badRequest(res, 'id must be a positive integer');
      return;
    }

    const tenant = await tenantService.getTenantById(tenant_id);
    if (!tenant) {
      notFound(res, `No tenant found for tenant_id: ${tenant_id}`);
      return;
    }

    const body = req.body as UpdateTicketRequest;
    if (!body || typeof body !== 'object') {
      badRequest(res, 'body must be a non-empty object for update');
      return;
    }

    const ticket = await ticketsService.updateTicket(tenant.app_id, tenant.id, ticketId, body);
    ok(res, ticket, 'Ticket updated successfully');
  })
);

export const adminRoutes: Router = router;
