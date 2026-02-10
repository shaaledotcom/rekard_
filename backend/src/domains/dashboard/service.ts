// Dashboard service - business logic
import * as repo from './repository.js';
import * as configurationService from '../configuration/service.js';
import * as tenantService from '../tenant/service.js';
import { env } from '../../config/env.js';
import type {
  DashboardResponse,
  DashboardPaginationParams,
  DashboardListResponse,
  PaginationParams,
  SortParams,
  PublicTicketDetails,
} from './types.js';
import { notFound } from '../../shared/errors/app-error.js';

const DEFAULT_SORT: SortParams = { sort_by: 'created_at', sort_order: 'desc' };

// Get full dashboard (live, upcoming, on-demand) - global
export const getDashboard = async (
  pagination: DashboardPaginationParams = {}
): Promise<DashboardResponse> => {
  const now = new Date();

  const [live, upcoming, on_demand] = await Promise.all([
    repo.listAllTicketsForDashboard(
      { live_only: true, now },
      { page: pagination.live_page || 1, page_size: pagination.live_page_size || 10 },
      DEFAULT_SORT
    ),
    repo.listAllTicketsForDashboard(
      { upcoming_only: true, now },
      { page: pagination.upcoming_page || 1, page_size: pagination.upcoming_page_size || 10 },
      DEFAULT_SORT
    ),
    repo.listAllTicketsForDashboard(
      { on_demand_only: true, now },
      { page: pagination.on_demand_page || 1, page_size: pagination.on_demand_page_size || 10 },
      DEFAULT_SORT
    ),
  ]);

  return { live, upcoming, on_demand };
};

// Get dashboard for specific domain/tenant
export const getDashboardByDomain = async (
  appId: string,
  tenantId: string,
  pagination: DashboardPaginationParams = {}
): Promise<DashboardResponse> => {
  const now = new Date();

  const [live, upcoming, on_demand] = await Promise.all([
    repo.listTicketsForDashboardByDomain(
      appId,
      tenantId,
      { live_only: true, now },
      { page: pagination.live_page || 1, page_size: pagination.live_page_size || 10 },
      DEFAULT_SORT
    ),
    repo.listTicketsForDashboardByDomain(
      appId,
      tenantId,
      { upcoming_only: true, now },
      { page: pagination.upcoming_page || 1, page_size: pagination.upcoming_page_size || 10 },
      DEFAULT_SORT
    ),
    repo.listTicketsForDashboardByDomain(
      appId,
      tenantId,
      { on_demand_only: true, now },
      { page: pagination.on_demand_page || 1, page_size: pagination.on_demand_page_size || 10 },
      DEFAULT_SORT
    ),
  ]);

  return { live, upcoming, on_demand };
};

// Get live tickets only
export const getLiveTickets = async (
  pagination: PaginationParams = {},
  appId?: string,
  tenantId?: string
): Promise<DashboardListResponse> => {
  const now = new Date();

  if (appId && tenantId) {
    return repo.listTicketsForDashboardByDomain(
      appId,
      tenantId,
      { live_only: true, now },
      pagination,
      DEFAULT_SORT
    );
  }

  return repo.listAllTicketsForDashboard(
    { live_only: true, now },
    pagination,
    DEFAULT_SORT
  );
};

// Get upcoming tickets only
export const getUpcomingTickets = async (
  pagination: PaginationParams = {},
  appId?: string,
  tenantId?: string
): Promise<DashboardListResponse> => {
  const now = new Date();

  if (appId && tenantId) {
    return repo.listTicketsForDashboardByDomain(
      appId,
      tenantId,
      { upcoming_only: true, now },
      pagination,
      DEFAULT_SORT
    );
  }

  return repo.listAllTicketsForDashboard(
    { upcoming_only: true, now },
    pagination,
    DEFAULT_SORT
  );
};

// Get on-demand/VOD tickets only
export const getOnDemandTickets = async (
  pagination: PaginationParams = {},
  appId?: string,
  tenantId?: string
): Promise<DashboardListResponse> => {
  const now = new Date();

  if (appId && tenantId) {
    return repo.listTicketsForDashboardByDomain(
      appId,
      tenantId,
      { on_demand_only: true, now },
      pagination,
      DEFAULT_SORT
    );
  }

  return repo.listAllTicketsForDashboard(
    { on_demand_only: true, now },
    pagination,
    DEFAULT_SORT
  );
};

// Get public ticket details
export const getPublicTicket = async (ticketId: number): Promise<PublicTicketDetails> => {
  const ticket = await repo.getPublicTicketById(ticketId);
  if (!ticket) {
    throw notFound('Ticket');
  }
  return ticket;
};

// Get public ticket by URL
export const getPublicTicketByUrl = async (url: string): Promise<PublicTicketDetails> => {
  const ticket = await repo.getPublicTicketByUrl(url);
  if (!ticket) {
    throw notFound('Ticket');
  }
  return ticket;
};

// Get events for a ticket (public)
export const getTicketEvents = async (ticketId: number): Promise<PublicTicketDetails['events']> => {
  const ticket = await repo.getPublicTicketById(ticketId);
  if (!ticket) {
    throw notFound('Ticket');
  }
  return ticket.events || [];
};

// Get Razorpay payment config for a ticket (based on ticket owner's platform)
export const getTicketPaymentConfig = async (ticketId: number): Promise<{ razorpay_key_id: string }> => {
  // Get ticket with app_id and tenant_id
  const ticket = await repo.getTicketByIdForPayment(ticketId);
  if (!ticket) {
    throw notFound('Ticket');
  }

  // Default to platform Razorpay key
  let razorpayKeyId = env.razorpay.keyId;

  // Try to get tenant's Razorpay key if configured
  if (ticket.appId && ticket.tenantId) {
    try {
      const tenant = await tenantService.getTenantById(ticket.tenantId);
      if (tenant && tenant.is_pro && tenant.user_id) {
        const paymentConfig = await configurationService.getPaymentGateway(
          ticket.appId,
          ticket.tenantId,
          tenant.user_id
        );
        // Check both 'key' and 'key_id' for compatibility
        const key = (paymentConfig?.settings as Record<string, unknown>)?.key || 
                    (paymentConfig?.settings as Record<string, unknown>)?.key_id;
        if (key) {
          razorpayKeyId = key as string;
        }
      }
    } catch (error) {
      // Use default key if tenant doesn't have their own
    }
  }

  return { razorpay_key_id: razorpayKeyId };
};

// Get Razorpay secret for a ticket (based on ticket owner's platform)
// Used for payment verification
export const getTicketRazorpaySecret = async (ticketId: number): Promise<string> => {
  // Get ticket with app_id and tenant_id
  const ticket = await repo.getTicketByIdForPayment(ticketId);
  if (!ticket) {
    // Fall back to default secret if ticket not found
    return env.razorpay.keySecret;
  }

  // Default to platform Razorpay secret
  let razorpaySecret = env.razorpay.keySecret;

  // Try to get tenant's Razorpay secret if configured
  if (ticket.appId && ticket.tenantId) {
    try {
      const tenant = await tenantService.getTenantById(ticket.tenantId);
      if (tenant && tenant.is_pro && tenant.user_id) {
        const paymentConfig = await configurationService.getPaymentGateway(
          ticket.appId,
          ticket.tenantId,
          tenant.user_id
        );
        const secret = (paymentConfig?.settings as Record<string, unknown>)?.secret;
        if (secret) {
          razorpaySecret = secret as string;
        }
      }
    } catch (error) {
      // Use default secret if tenant doesn't have their own
    }
  }

  return razorpaySecret;
};

