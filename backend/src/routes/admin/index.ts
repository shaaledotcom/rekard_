// Admin routes - protected by ADMIN_API_KEY, no user session required
import { Router, Request, Response, NextFunction } from 'express';
import * as billingService from '../../domains/billing/service.js';
import * as tenantService from '../../domains/tenant/service.js';
import * as ticketsService from '../../domains/tickets/service.js';
import type { CreateTicketRequest, UpdateTicketRequest } from '../../domains/tickets/types.js';
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
 * POST /v1/admin/tenants/:tenant_id/wallet/purchase-tickets
 * Add tickets to a tenant's wallet (admin only). Same effect as producer
 * POST /v1/producer/billing/wallet/purchase-tickets but without producer session.
 * Use when producer paid outside the app; you sync by crediting their wallet.
 *
 * Body: { quantity: number } (required). Optional: currency, external_payment_id.
 */
router.post(
  '/tenants/:tenant_id/wallet/purchase-tickets',
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

    const { quantity, currency, external_payment_id } = req.body || {};
    if (quantity === undefined || typeof quantity !== 'number') {
      badRequest(res, 'quantity is required and must be a number');
      return;
    }
    if (quantity <= 0) {
      badRequest(res, 'quantity must be greater than 0');
      return;
    }

    const invoice = await billingService.purchaseTickets(
      tenant.app_id,
      tenant.id,
      tenant.user_id,
      { quantity, currency, external_payment_id }
    );
    created(res, invoice, 'Tickets purchased successfully');
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
