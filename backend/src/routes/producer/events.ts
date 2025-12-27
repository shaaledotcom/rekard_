// Producer events routes
import { Router, Response } from 'express';
import * as eventsService from '../../domains/events/service.js';
import type {
  CreateEventRequest,
  UpdateEventRequest,
  EventFilter,
  PaginationParams,
  SortParams,
} from '../../domains/events/types.js';
import { requireSession } from '../../domains/auth/session.js';
import { requireRole } from '../../domains/auth/roles.js';
import { tenantMiddleware, getTenantContext } from '../../shared/middleware/tenant.js';
import { ok, okList, created, noContent, badRequest } from '../../shared/utils/response.js';
import { asyncHandler } from '../../shared/middleware/error-handler.js';
import type { AppRequest } from '../../shared/types/index.js';
import { ROLE_PRODUCER } from '../../domains/auth/constants.js';

const router = Router();

// Apply middleware
router.use(requireSession);
router.use(tenantMiddleware);
// router.use(requireRole(ROLE_PRODUCER));

// Create event
router.post('/', asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  const data: CreateEventRequest = req.body;

  const event = await eventsService.createEvent(tenant.appId, tenant.tenantId, data);
  created(res, event, 'Event created successfully');
}));

// Get event by ID
router.get('/:id', asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  const eventId = parseInt(req.params.id, 10);

  if (isNaN(eventId)) {
    return badRequest(res, 'Invalid event ID');
  }

  const event = await eventsService.getEvent(tenant.appId, tenant.tenantId, eventId);
  ok(res, event);
}));

// Update event
router.put('/:id', asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  const eventId = parseInt(req.params.id, 10);

  if (isNaN(eventId)) {
    return badRequest(res, 'Invalid event ID');
  }

  const data: UpdateEventRequest = req.body;
  const event = await eventsService.updateEvent(tenant.appId, tenant.tenantId, eventId, data);
  ok(res, event, 'Event updated successfully');
}));

// Delete event
router.delete('/:id', asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  const eventId = parseInt(req.params.id, 10);

  if (isNaN(eventId)) {
    return badRequest(res, 'Invalid event ID');
  }

  await eventsService.deleteEvent(tenant.appId, tenant.tenantId, eventId);
  noContent(res);
}));

// Helper to sanitize pagination values
const sanitizePagination = (page: string | undefined, pageSize: string | undefined): PaginationParams => {
  const parsedPage = parseInt(page as string, 10);
  const parsedPageSize = parseInt(pageSize as string, 10);
  
  return {
    page: isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage,
    page_size: isNaN(parsedPageSize) || parsedPageSize < 1 ? 10 : Math.min(parsedPageSize, 100),
  };
};

// List events
router.get('/', asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);

  const filter: EventFilter = {
    status: req.query.status as EventFilter['status'],
    language: req.query.language as string,
    is_vod: req.query.is_vod === 'true' ? true : req.query.is_vod === 'false' ? false : undefined,
    start_date_from: req.query.start_date_from ? new Date(req.query.start_date_from as string) : undefined,
    start_date_to: req.query.start_date_to ? new Date(req.query.start_date_to as string) : undefined,
    search: req.query.search as string,
  };

  const pagination = sanitizePagination(req.query.page as string, req.query.page_size as string);

  const sort: SortParams = {
    sort_by: req.query.sort_by as string,
    sort_order: (req.query.sort_order as 'asc' | 'desc') || 'desc',
  };

  const result = await eventsService.listEvents(tenant.appId, tenant.tenantId, filter, pagination, sort);
  okList(res, result);
}));

// Publish event
router.post('/:id/publish', asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  const eventId = parseInt(req.params.id, 10);

  if (isNaN(eventId)) {
    return badRequest(res, 'Invalid event ID');
  }

  const event = await eventsService.publishEvent(tenant.appId, tenant.tenantId, eventId);
  ok(res, event, 'Event published successfully');
}));

// Cancel event
router.post('/:id/cancel', asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  const eventId = parseInt(req.params.id, 10);

  if (isNaN(eventId)) {
    return badRequest(res, 'Invalid event ID');
  }

  const event = await eventsService.cancelEvent(tenant.appId, tenant.tenantId, eventId);
  ok(res, event, 'Event cancelled successfully');
}));

// Complete event
router.post('/:id/complete', asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  const eventId = parseInt(req.params.id, 10);

  if (isNaN(eventId)) {
    return badRequest(res, 'Invalid event ID');
  }

  const event = await eventsService.completeEvent(tenant.appId, tenant.tenantId, eventId);
  ok(res, event, 'Event completed successfully');
}));

// Archive event
router.post('/:id/archive', asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  const eventId = parseInt(req.params.id, 10);

  if (isNaN(eventId)) {
    return badRequest(res, 'Invalid event ID');
  }

  const event = await eventsService.archiveEvent(tenant.appId, tenant.tenantId, eventId);
  ok(res, event, 'Event archived successfully');
}));

// Set event to draft
router.post('/:id/draft', asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  const eventId = parseInt(req.params.id, 10);

  if (isNaN(eventId)) {
    return badRequest(res, 'Invalid event ID');
  }

  const event = await eventsService.setEventDraft(tenant.appId, tenant.tenantId, eventId);
  ok(res, event, 'Event set to draft successfully');
}));

// Get live events
router.get('/dashboard/live', asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  const events = await eventsService.getLiveEvents(tenant.appId, tenant.tenantId);
  ok(res, events);
}));

// Get upcoming events
router.get('/dashboard/upcoming', asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  const limit = parseInt(req.query.limit as string, 10) || 10;
  const events = await eventsService.getUpcomingEvents(tenant.appId, tenant.tenantId, limit);
  ok(res, events);
}));

export const eventsRoutes: Router = router;
