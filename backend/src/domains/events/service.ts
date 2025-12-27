// Events service - business logic
import * as repo from './repository.js';
import * as ticketRepo from '../tickets/repository.js';
import type {
  Event,
  CreateEventRequest,
  UpdateEventRequest,
  EventFilter,
  EventListResponse,
  PaginationParams,
  SortParams,
  EventStatus,
} from './types.js';
import { VALID_EVENT_STATUSES } from './types.js';
import { log } from '../../shared/middleware/logger.js';
import { badRequest, notFound } from '../../shared/errors/app-error.js';

// Validation helper for status
const isValidStatus = (status: string): status is EventStatus => {
  return VALID_EVENT_STATUSES.includes(status as EventStatus);
};

// Validation
const validateEventRequest = (data: CreateEventRequest): void => {
  if (!data.title || data.title.trim() === '') {
    throw badRequest('Title is required');
  }
  if (!data.start_datetime) {
    throw badRequest('Start datetime is required');
  }
  if (!data.end_datetime) {
    throw badRequest('End datetime is required');
  }
  if (new Date(data.start_datetime) >= new Date(data.end_datetime)) {
    throw badRequest('End datetime must be after start datetime');
  }
  // Validate status if provided
  if (data.status && !isValidStatus(data.status)) {
    throw badRequest(`Invalid status value. Must be one of: ${VALID_EVENT_STATUSES.join(', ')}`);
  }
};

// CRUD operations
export const createEvent = async (
  appId: string,
  tenantId: string,
  data: CreateEventRequest
): Promise<Event> => {
  validateEventRequest(data);

  const event = await repo.createEvent(appId, tenantId, data);
  log.info(`Created event ${event.id} for tenant ${tenantId}`);
  return event;
};

export const getEvent = async (
  appId: string,
  tenantId: string,
  eventId: number
): Promise<Event> => {
  const event = await repo.getEventById(appId, tenantId, eventId);
  if (!event) {
    throw notFound('Event');
  }
  return event;
};

export const updateEvent = async (
  appId: string,
  tenantId: string,
  eventId: number,
  data: UpdateEventRequest
): Promise<Event> => {
  // Validate date constraints if both are provided
  if (data.start_datetime && data.end_datetime) {
    if (new Date(data.start_datetime) >= new Date(data.end_datetime)) {
      throw badRequest('End datetime must be after start datetime');
    }
  }

  // Validate status if provided
  if (data.status && !isValidStatus(data.status)) {
    throw badRequest(`Invalid status value. Must be one of: ${VALID_EVENT_STATUSES.join(', ')}`);
  }

  const event = await repo.updateEvent(appId, tenantId, eventId, data);
  if (!event) {
    throw notFound('Event');
  }

  log.info(`Updated event ${eventId} for tenant ${tenantId}`);
  return event;
};

export const deleteEvent = async (
  appId: string,
  tenantId: string,
  eventId: number
): Promise<void> => {
  const deleted = await repo.deleteEvent(appId, tenantId, eventId);
  if (!deleted) {
    throw notFound('Event');
  }
  log.info(`Deleted event ${eventId} for tenant ${tenantId}`);
};

export const listEvents = async (
  appId: string,
  tenantId: string,
  filter: EventFilter = {},
  pagination: PaginationParams = {},
  sort: SortParams = {}
): Promise<EventListResponse> => {
  return repo.listEvents(appId, tenantId, filter, pagination, sort);
};

// Status management
export const publishEvent = async (
  appId: string,
  tenantId: string,
  eventId: number
): Promise<Event> => {
  const event = await repo.getEventById(appId, tenantId, eventId);
  if (!event) {
    throw notFound('Event');
  }

  if (event.status === 'published' || event.status === 'live') {
    throw badRequest('Event is already published');
  }

  const updated = await repo.updateEvent(appId, tenantId, eventId, { status: 'published' });
  log.info(`Published event ${eventId}`);
  return updated!;
};

export const cancelEvent = async (
  appId: string,
  tenantId: string,
  eventId: number
): Promise<Event> => {
  const event = await repo.getEventById(appId, tenantId, eventId);
  if (!event) {
    throw notFound('Event');
  }

  if (event.status === 'cancelled') {
    throw badRequest('Event is already cancelled');
  }

  const updated = await repo.updateEvent(appId, tenantId, eventId, { status: 'cancelled' });
  log.info(`Cancelled event ${eventId}`);
  return updated!;
};

export const completeEvent = async (
  appId: string,
  tenantId: string,
  eventId: number
): Promise<Event> => {
  const event = await repo.getEventById(appId, tenantId, eventId);
  if (!event) {
    throw notFound('Event');
  }

  const updated = await repo.updateEvent(appId, tenantId, eventId, { status: 'completed' });
  log.info(`Completed event ${eventId}`);
  return updated!;
};

export const archiveEvent = async (
  appId: string,
  tenantId: string,
  eventId: number
): Promise<Event> => {
  const event = await repo.getEventById(appId, tenantId, eventId);
  if (!event) {
    throw notFound('Event');
  }

  if (event.status === 'archived') {
    throw badRequest('Event is already archived');
  }

  const updated = await repo.updateEvent(appId, tenantId, eventId, { status: 'archived' });
  log.info(`Archived event ${eventId}`);

  // Check if any tickets that contain this event should be auto-archived
  // A ticket is auto-archived when ALL of its events are archived
  await checkAndArchiveTicketsForEvent(appId, tenantId, eventId);

  return updated!;
};

// Helper function to check and archive tickets when all their events are archived
const checkAndArchiveTicketsForEvent = async (
  appId: string,
  tenantId: string,
  eventId: number
): Promise<void> => {
  const ticketsWithEvents = await ticketRepo.getTicketsContainingEvent(appId, tenantId, eventId);

  for (const { ticket, events } of ticketsWithEvents) {
    // Skip if ticket is already archived
    if (ticket.status === 'archived') continue;

    // Check if ALL events in this ticket are now archived
    const allEventsArchived = events.every((e) => e.status === 'archived');
    
    if (allEventsArchived) {
      await ticketRepo.archiveTicketById(appId, tenantId, ticket.id);
      log.info(`Auto-archived ticket ${ticket.id} because all its events are archived`);
    }
  }
};

export const setEventDraft = async (
  appId: string,
  tenantId: string,
  eventId: number
): Promise<Event> => {
  const event = await repo.getEventById(appId, tenantId, eventId);
  if (!event) {
    throw notFound('Event');
  }

  if (event.status === 'draft') {
    throw badRequest('Event is already a draft');
  }

  const updated = await repo.updateEvent(appId, tenantId, eventId, { status: 'draft' });
  log.info(`Set event ${eventId} to draft`);
  return updated!;
};

// Dashboard queries
export const getLiveEvents = async (
  appId: string,
  tenantId: string
): Promise<Event[]> => {
  return repo.getLiveEvents(appId, tenantId);
};

export const getUpcomingEvents = async (
  appId: string,
  tenantId: string,
  limit: number = 10
): Promise<Event[]> => {
  return repo.getUpcomingEvents(appId, tenantId, limit);
};

export const getEventsByIds = async (
  appId: string,
  tenantId: string,
  eventIds: number[]
): Promise<Event[]> => {
  return repo.getEventsByIds(appId, tenantId, eventIds);
};
