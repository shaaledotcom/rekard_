// Tickets service - business logic
import * as repo from './repository.js';
import type {
  Ticket,
  CreateTicketRequest,
  UpdateTicketRequest,
  TicketFilter,
  TicketListResponse,
  PaginationParams,
  SortParams,
  ValidateCouponResult,
} from './types.js';
import { log } from '../../shared/middleware/logger.js';
import { badRequest, notFound } from '../../shared/errors/app-error.js';

// URL normalization
const normalizeUrl = (url: string | undefined): string | undefined => {
  if (!url) return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return `https://${trimmed}`;
};

// Validation
const validateTicketRequest = (data: CreateTicketRequest): void => {
  if (!data.title || data.title.trim() === '') {
    throw badRequest('Title is required');
  }
  if (data.price < 0) {
    throw badRequest('Price cannot be negative');
  }
  if (!data.total_quantity || data.total_quantity <= 0) {
    throw badRequest('Total quantity must be greater than 0');
  }
};

// CRUD operations
export const createTicket = async (
  appId: string,
  tenantId: string,
  data: CreateTicketRequest
): Promise<Ticket> => {
  validateTicketRequest(data);

  // Normalize URL
  if (data.url) {
    data.url = normalizeUrl(data.url);
  }

  const ticket = await repo.createTicket(appId, tenantId, data);
  log.info(`Created ticket ${ticket.id} for tenant ${tenantId}`);
  return ticket;
};

export const getTicket = async (
  appId: string,
  tenantId: string,
  ticketId: number,
  includeRelations: boolean = true
): Promise<Ticket> => {
  const ticket = await repo.getTicketById(appId, tenantId, ticketId, includeRelations);
  if (!ticket) {
    throw notFound('Ticket');
  }
  return ticket;
};

export const updateTicket = async (
  appId: string,
  tenantId: string,
  ticketId: number,
  data: UpdateTicketRequest
): Promise<Ticket> => {
  if (data.price !== undefined && data.price < 0) {
    throw badRequest('Price cannot be negative');
  }
  if (data.total_quantity !== undefined && data.total_quantity <= 0) {
    throw badRequest('Total quantity must be greater than 0');
  }

  // Normalize URL
  if (data.url) {
    data.url = normalizeUrl(data.url);
  }

  const ticket = await repo.updateTicket(appId, tenantId, ticketId, data);
  if (!ticket) {
    throw notFound('Ticket');
  }

  log.info(`Updated ticket ${ticketId} for tenant ${tenantId}`);
  return ticket;
};

export const deleteTicket = async (
  appId: string,
  tenantId: string,
  ticketId: number
): Promise<void> => {
  const deleted = await repo.deleteTicket(appId, tenantId, ticketId);
  if (!deleted) {
    throw notFound('Ticket');
  }
  log.info(`Deleted ticket ${ticketId} for tenant ${tenantId}`);
};

export const listTickets = async (
  appId: string,
  tenantId: string,
  filter: TicketFilter = {},
  pagination: PaginationParams = {},
  sort: SortParams = {}
): Promise<TicketListResponse> => {
  return repo.listTickets(appId, tenantId, filter, pagination, sort);
};

// Status management
export const publishTicket = async (
  appId: string,
  tenantId: string,
  ticketId: number
): Promise<Ticket> => {
  const ticket = await repo.getTicketById(appId, tenantId, ticketId, false);
  if (!ticket) {
    throw notFound('Ticket');
  }

  if (ticket.status === 'published') {
    throw badRequest('Ticket is already published');
  }

  const updated = await repo.updateTicket(appId, tenantId, ticketId, { status: 'published' });
  log.info(`Published ticket ${ticketId}`);
  return updated!;
};

export const archiveTicket = async (
  appId: string,
  tenantId: string,
  ticketId: number
): Promise<Ticket> => {
  const ticket = await repo.getTicketById(appId, tenantId, ticketId, false);
  if (!ticket) {
    throw notFound('Ticket');
  }

  const updated = await repo.updateTicket(appId, tenantId, ticketId, { status: 'archived' });
  log.info(`Archived ticket ${ticketId}`);
  return updated!;
};

// Availability check
export const checkAvailability = async (
  appId: string,
  tenantId: string,
  ticketId: number,
  quantity: number
): Promise<{ available: boolean; remaining: number }> => {
  const ticket = await repo.getTicketById(appId, tenantId, ticketId, false);
  if (!ticket) {
    throw notFound('Ticket');
  }

  const remaining = ticket.total_quantity - ticket.sold_quantity;
  return {
    available: remaining >= quantity,
    remaining,
  };
};

// Coupon validation
export const validateCoupon = async (
  appId: string,
  tenantId: string,
  ticketId: number,
  code: string,
  purchaseAmount: number
): Promise<ValidateCouponResult> => {
  const coupon = await repo.getCouponByCode(appId, tenantId, ticketId, code);

  if (!coupon) {
    return { valid: false, error: 'Coupon not found' };
  }

  if (!coupon.is_active) {
    return { valid: false, error: 'Coupon is not active' };
  }

  const now = new Date();
  if (coupon.activation_time && new Date(coupon.activation_time) > now) {
    return { valid: false, error: 'Coupon is not yet valid' };
  }
  if (coupon.expiry_time && new Date(coupon.expiry_time) < now) {
    return { valid: false, error: 'Coupon has expired' };
  }

  if (coupon.count > 0 && coupon.used_count >= coupon.count) {
    return { valid: false, error: 'Coupon usage limit reached' };
  }

  // Calculate discount (assuming discount is percentage)
  const discountAmount = Math.min(
    (purchaseAmount * coupon.discount) / 100,
    purchaseAmount
  );

  return {
    valid: true,
    coupon,
    discount_amount: discountAmount,
  };
};

export const applyCoupon = async (couponId: number): Promise<boolean> => {
  return repo.incrementCouponUsage(couponId);
};

// Sales operations
export const reserveTickets = async (
  ticketId: number,
  quantity: number
): Promise<boolean> => {
  return repo.incrementSoldQuantity(ticketId, quantity);
};

export const releaseTickets = async (
  ticketId: number,
  quantity: number
): Promise<boolean> => {
  return repo.decrementSoldQuantity(ticketId, quantity);
};

// Get tickets by event
export const getTicketsByEventId = async (
  appId: string,
  tenantId: string,
  eventId: number
): Promise<Ticket[]> => {
  return repo.getTicketsByEventId(appId, tenantId, eventId);
};
