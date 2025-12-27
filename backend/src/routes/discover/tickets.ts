// Public ticket routes (no auth required)
import { Router, Response } from 'express';
import * as dashboardService from '../../domains/dashboard/service.js';
import { ok, badRequest } from '../../shared/utils/response.js';
import type { AppRequest } from '../../shared/types/index.js';
import { asyncHandler } from '@/shared/index.js';

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

  const ticket = await dashboardService.getPublicTicketByUrl(url);
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

export const discoverTicketsRoutes: Router = router;

