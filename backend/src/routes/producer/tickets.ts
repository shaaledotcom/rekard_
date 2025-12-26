// Producer tickets routes
import { Router, Response } from 'express';
import * as ticketsService from '../../domains/tickets/service.js';
import type {
  CreateTicketRequest,
  UpdateTicketRequest,
  TicketFilter,
  PaginationParams,
  SortParams,
} from '../../domains/tickets/types.js';
import { requireSession } from '../../domains/auth/session.js';
import { requireRole } from '../../domains/auth/roles.js';
import { tenantMiddleware, getTenantContext } from '../../shared/middleware/tenant.js';
import { asyncHandler } from '../../shared/middleware/error-handler.js';
import { ok, okList, created, noContent, badRequest } from '../../shared/utils/response.js';
import type { AppRequest } from '../../shared/types/index.js';
import { ROLE_PRODUCER } from '../../domains/auth/constants.js';
import { mediaUpload } from '../../shared/utils/file-upload.js';

const router = Router();

// Parse form-data value - handles strings that might be JSON
const parseValue = (value: unknown): unknown => {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string') return value;
  
  // Try parsing as JSON for arrays/objects
  if (value.startsWith('[') || value.startsWith('{')) {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  
  // Parse booleans
  if (value === 'true') return true;
  if (value === 'false') return false;
  
  // Parse numbers
  if (/^-?\d+(\.\d+)?$/.test(value)) {
    return Number(value);
  }
  
  return value;
};

// Parse entire form-data body
const parseFormBody = (body: Record<string, unknown>): Record<string, unknown> => {
  const parsed: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    parsed[key] = parseValue(value);
  }
  return parsed;
};

// Apply middleware
router.use(requireSession);
router.use(tenantMiddleware);
router.use(requireRole(ROLE_PRODUCER));

// Create ticket (accepts form-data)
router.post('/', mediaUpload.fields([
  { name: 'thumbnail_image_portrait', maxCount: 1 },
  { name: 'featured_image', maxCount: 1 },
  { name: 'featured_video', maxCount: 1 },
]), asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  const data = parseFormBody(req.body) as CreateTicketRequest;

  // TODO: Handle file uploads to S3 and set URLs

  const ticket = await ticketsService.createTicket(tenant.appId, tenant.tenantId, data);
  created(res, ticket, 'Ticket created successfully');
}));

// Get ticket by ID
router.get('/:id', asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  const ticketId = parseInt(req.params.id, 10);

  if (isNaN(ticketId)) {
    return badRequest(res, 'Invalid ticket ID');
  }

  const ticket = await ticketsService.getTicket(tenant.appId, tenant.tenantId, ticketId, true);
  ok(res, ticket);
}));

// Update ticket (accepts form-data)
router.put('/:id', mediaUpload.fields([
  { name: 'thumbnail_image_portrait', maxCount: 1 },
  { name: 'featured_image', maxCount: 1 },
  { name: 'featured_video', maxCount: 1 },
]), asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  const ticketId = parseInt(req.params.id, 10);

  if (isNaN(ticketId)) {
    return badRequest(res, 'Invalid ticket ID');
  }

  const data = parseFormBody(req.body) as UpdateTicketRequest;

  // TODO: Handle file uploads to S3 and set URLs

  const ticket = await ticketsService.updateTicket(tenant.appId, tenant.tenantId, ticketId, data);
  ok(res, ticket, 'Ticket updated successfully');
}));

// Delete ticket
router.delete('/:id', asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  const ticketId = parseInt(req.params.id, 10);

  if (isNaN(ticketId)) {
    return badRequest(res, 'Invalid ticket ID');
  }

  await ticketsService.deleteTicket(tenant.appId, tenant.tenantId, ticketId);
  noContent(res);
}));

// List tickets
router.get('/', asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);

  const filter: TicketFilter = {
    status: req.query.status as TicketFilter['status'],
    search: req.query.search as string,
    event_id: req.query.event_id ? parseInt(req.query.event_id as string, 10) : undefined,
  };

  const pagination: PaginationParams = {
    page: parseInt(req.query.page as string, 10) || 1,
    page_size: parseInt(req.query.page_size as string, 10) || 10,
  };

  const sort: SortParams = {
    sort_by: req.query.sort_by as string,
    sort_order: (req.query.sort_order as 'asc' | 'desc') || 'desc',
  };

  const result = await ticketsService.listTickets(tenant.appId, tenant.tenantId, filter, pagination, sort);
  okList(res, result);
}));

// Publish ticket
router.post('/:id/publish', asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  const ticketId = parseInt(req.params.id, 10);

  if (isNaN(ticketId)) {
    return badRequest(res, 'Invalid ticket ID');
  }

  const ticket = await ticketsService.publishTicket(tenant.appId, tenant.tenantId, ticketId);
  ok(res, ticket, 'Ticket published successfully');
}));

// Archive ticket
router.post('/:id/archive', asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  const ticketId = parseInt(req.params.id, 10);

  if (isNaN(ticketId)) {
    return badRequest(res, 'Invalid ticket ID');
  }

  const ticket = await ticketsService.archiveTicket(tenant.appId, tenant.tenantId, ticketId);
  ok(res, ticket, 'Ticket archived successfully');
}));

// Check ticket availability
router.get('/:id/availability', asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  const ticketId = parseInt(req.params.id, 10);
  const quantity = parseInt(req.query.quantity as string, 10) || 1;

  if (isNaN(ticketId)) {
    return badRequest(res, 'Invalid ticket ID');
  }

  const result = await ticketsService.checkAvailability(tenant.appId, tenant.tenantId, ticketId, quantity);
  ok(res, result);
}));

// Get tickets by event
router.get('/by-event/:eventId', asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  const eventId = parseInt(req.params.eventId, 10);

  if (isNaN(eventId)) {
    return badRequest(res, 'Invalid event ID');
  }

  const tickets = await ticketsService.getTicketsByEventId(tenant.appId, tenant.tenantId, eventId);
  ok(res, tickets);
}));

// Validate coupon
router.post('/:id/validate-coupon', asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  const ticketId = parseInt(req.params.id, 10);
  const { code, amount } = req.body;

  if (isNaN(ticketId)) {
    return badRequest(res, 'Invalid ticket ID');
  }

  if (!code) {
    return badRequest(res, 'Coupon code is required');
  }

  const result = await ticketsService.validateCoupon(
    tenant.appId,
    tenant.tenantId,
    ticketId,
    code,
    amount || 0
  );
  ok(res, result);
}));

export const ticketsRoutes: Router = router;
