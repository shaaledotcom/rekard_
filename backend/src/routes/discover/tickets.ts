// Public ticket routes (no auth required)
import { Router, Response } from 'express';
import * as dashboardService from '../../domains/dashboard/service.js';
import { ok, badRequest } from '../../shared/utils/response.js';
import type { AppRequest } from '../../shared/types/index.js';
import { asyncHandler } from '../../shared/index.js';

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

  // Extract tenant context from request (resolved from domain or headers)
  // This ensures tickets are filtered by tenant when accessed from custom domains
  // Prevents URL collisions when multiple tenants use the same URL slug
  const tenant = req.tenant;
  const tenantId = tenant?.tenantId && tenant.tenantId !== '00000000-0000-0000-0000-000000000000'
    ? tenant.tenantId
    : undefined;
  const appId = tenant?.appId || undefined;

  const ticket = await dashboardService.getPublicTicketByUrl(url, tenantId, appId);
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

