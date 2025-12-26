// Dashboard service - business logic
import * as repo from './repository.js';
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

