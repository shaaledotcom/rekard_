// Public ticket routes (no auth required)
import { Router, Response } from 'express';
import * as dashboardService from '../../domains/dashboard/service.js';
import * as tenantConfig from '../../domains/tenant/config.js';
import { ok, badRequest } from '../../shared/utils/response.js';
import type { AppRequest } from '../../shared/types/index.js';
import { asyncHandler } from '../../shared/index.js';
import { SYSTEM_TENANT_ID } from '../../shared/middleware/tenant.js';

const router = Router();

// Get public ticket by ID
router.get('/:id', asyncHandler(async (req: AppRequest, res: Response) => {
  const ticketId = parseInt(req.params.id, 10);

  if (isNaN(ticketId)) {
    return badRequest(res, 'Invalid ticket ID');
  }

  const ticket = await dashboardService.getPublicTicket(ticketId);
  ok(res, ticket);
}));

// Get public ticket by URL (use wildcard to capture URL with slashes)
router.get('/by-url/*', asyncHandler(async (req: AppRequest, res: Response) => {
  // Get the URL from the wildcard parameter (everything after /by-url/)
  const url = '/' + req.params[0];

  if (!url || url === '/') {
    return badRequest(res, 'URL is required');
  }

  // Get tenant context from middleware (resolved from domain or session)
  const tenant = req.tenant;
  if (!tenant) {
    return badRequest(res, 'Tenant context not available');
  }

  // Check if this is a shared domain request
  // Shared domains resolve to SYSTEM_TENANT_ID, but tickets belong to individual free tenants
  const host = (req.headers['x-host'] as string) || req.headers.host || '';
  const isSharedDomain = tenantConfig.isSharedDomain(host) || 
                        (tenant.tenantId === SYSTEM_TENANT_ID && tenant.resolvedFrom === 'default');

  const ticket = await dashboardService.getPublicTicketByUrl(
    url, 
    tenant.appId, 
    tenant.tenantId,
    isSharedDomain
  );
  ok(res, ticket);
}));

// Get events for a ticket
router.get('/:id/events', asyncHandler(async (req: AppRequest, res: Response) => {
  const ticketId = parseInt(req.params.id, 10);

  if (isNaN(ticketId)) {
    return badRequest(res, 'Invalid ticket ID');
  }

  const events = await dashboardService.getTicketEvents(ticketId);
  ok(res, { events });
}));

// Get payment config for a ticket (Razorpay key based on ticket owner's platform)
router.get('/:id/payment-config', asyncHandler(async (req: AppRequest, res: Response) => {
  const ticketId = parseInt(req.params.id, 10);

  if (isNaN(ticketId)) {
    return badRequest(res, 'Invalid ticket ID');
  }

  const config = await dashboardService.getTicketPaymentConfig(ticketId);
  ok(res, config);
}));

export const discoverTicketsRoutes: Router = router;

