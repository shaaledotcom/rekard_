// Dashboard repository - public access database operations using Drizzle ORM
import { eq, and, gte, lte, gt, desc, asc, inArray, isNull, or } from 'drizzle-orm';
import { db, tickets, ticketEvents, ticketPricing, ticketSponsors, events, tenants } from '../../db/index';
import type {
  DashboardTicket,
  DashboardTicketFilter,
  DashboardListResponse,
  PaginationParams,
  SortParams,
  PublicTicketDetails,
  PublicEventDetails,
  PublicTicketPricing,
  PublicTicketSponsor,
} from './types';

/**
 * List all tickets for dashboard (global - shared domain)
 * Shows tickets from:
 * - Free users (non-Pro)
 * - Pro users WITHOUT custom domains
 * 
 * Excludes Pro users WITH custom domains (they should only show on their own domain)
 */
export const listAllTicketsForDashboard = async (
  filter: DashboardTicketFilter = {},
  pagination: PaginationParams = {},
  sort: SortParams = {}
): Promise<DashboardListResponse> => {
  const page = Math.max(1, pagination.page || 1);
  const pageSize = Math.max(1, Math.min(100, pagination.page_size || 10));
  const offset = (page - 1) * pageSize;
  const now = filter.now || new Date();

  // Build conditions - show all tickets EXCEPT Pro users with custom domains
  // Logic: Show if (NOT Pro) OR (Pro AND no custom domain)
  // Which is: (isPro = false) OR (isPro = true AND primaryDomain IS NULL)
  const conditions = [
    eq(tickets.status, 'published'),
    eq(tenants.status, 'active'), // Only active tenants
    // Exclude Pro users with custom domains - they should only show on their own domain
    or(
      eq(tenants.isPro, false), // Free users
      and(
        eq(tenants.isPro, true),
        isNull(tenants.primaryDomain) // Pro users without custom domains
      )!
    )!,
  ];

  if (filter.live_only) {
    conditions.push(lte(events.startDatetime, now));
    conditions.push(gte(events.endDatetime, now));
  }
  if (filter.upcoming_only) {
    conditions.push(gt(events.startDatetime, now));
  }
  if (filter.on_demand_only) {
    conditions.push(eq(events.isVod, true));
  }

  // Get tickets with their events - join with tenants to filter by pro status
  const ticketData = await db
    .selectDistinct({
      id: tickets.id,
      title: tickets.title,
      description: tickets.description,
      thumbnailImagePortrait: tickets.thumbnailImagePortrait,
      url: tickets.url,
      createdAt: tickets.createdAt,
    })
    .from(tickets)
    .innerJoin(tenants, eq(tenants.id, tickets.tenantId))
    .innerJoin(ticketEvents, eq(ticketEvents.ticketId, tickets.id))
    .innerJoin(events, eq(events.id, ticketEvents.eventId))
    .where(and(...conditions))
    .orderBy(sort.sort_order === 'asc' ? asc(tickets.createdAt) : desc(tickets.createdAt))
    .limit(pageSize)
    .offset(offset);

  // Get total count (approximate)
  const total = ticketData.length < pageSize ? offset + ticketData.length : offset + pageSize + 1;

  return {
    data: ticketData.map(mapToDashboardTicket),
    total,
    page,
    page_size: pageSize,
    total_pages: Math.ceil(total / pageSize),
  };
};

// List tickets for dashboard by domain (tenant-specific)
export const listTicketsForDashboardByDomain = async (
  appId: string,
  tenantId: string,
  filter: DashboardTicketFilter = {},
  pagination: PaginationParams = {},
  sort: SortParams = {}
): Promise<DashboardListResponse> => {
  const page = Math.max(1, pagination.page || 1);
  const pageSize = Math.max(1, Math.min(100, pagination.page_size || 10));
  const offset = (page - 1) * pageSize;
  const now = filter.now || new Date();

  // Build conditions
  const conditions = [
    eq(tickets.appId, appId),
    eq(tickets.tenantId, tenantId),
    eq(tickets.status, 'published'),
  ];

  if (filter.live_only) {
    conditions.push(lte(events.startDatetime, now));
    conditions.push(gte(events.endDatetime, now));
  }
  if (filter.upcoming_only) {
    conditions.push(gt(events.startDatetime, now));
  }
  if (filter.on_demand_only) {
    conditions.push(eq(events.isVod, true));
  }

  // Get tickets with their events
  const ticketData = await db
    .selectDistinct({
      id: tickets.id,
      title: tickets.title,
      description: tickets.description,
      thumbnailImagePortrait: tickets.thumbnailImagePortrait,
      url: tickets.url,
      createdAt: tickets.createdAt,
    })
    .from(tickets)
    .innerJoin(ticketEvents, eq(ticketEvents.ticketId, tickets.id))
    .innerJoin(events, eq(events.id, ticketEvents.eventId))
    .where(and(...conditions))
    .orderBy(sort.sort_order === 'asc' ? asc(tickets.createdAt) : desc(tickets.createdAt))
    .limit(pageSize)
    .offset(offset);

  // Get total count (approximate)
  const total = ticketData.length < pageSize ? offset + ticketData.length : offset + pageSize + 1;

  return {
    data: ticketData.map(mapToDashboardTicket),
    total,
    page,
    page_size: pageSize,
    total_pages: Math.ceil(total / pageSize),
  };
};

// Get ticket details for public view
export const getPublicTicketById = async (ticketId: number): Promise<PublicTicketDetails | null> => {
  const [ticket] = await db
    .select()
    .from(tickets)
    .where(
      and(
        eq(tickets.id, ticketId),
        eq(tickets.status, 'published')
      )
    )
    .limit(1);

  if (!ticket) return null;

  // Get events
  const eventsList = await getTicketEvents(ticketId);

  // Get pricing
  const pricing = await getTicketPricing(ticketId);

  // Get sponsors
  const sponsors = await getTicketSponsors(ticketId);

  return {
    id: ticket.id,
    title: ticket.title,
    description: ticket.description || undefined,
    url: ticket.url || undefined,
    thumbnail_image_portrait: ticket.thumbnailImagePortrait || undefined,
    featured_image: ticket.featuredImage || undefined,
    featured_video: ticket.featuredVideo || undefined,
    price: ticket.price ? parseFloat(ticket.price) : 0,
    currency: ticket.currency || 'INR',
    total_quantity: ticket.totalQuantity || 0,
    sold_quantity: ticket.soldQuantity || 0,
    status: ticket.status || 'draft',
    events: eventsList,
    pricing,
    sponsors,
  };
};

// Get ticket by URL for public view
export const getPublicTicketByUrl = async (url: string): Promise<PublicTicketDetails | null> => {
  // Try exact match first
  let [ticket] = await db
    .select()
    .from(tickets)
    .where(
      and(
        eq(tickets.url, url),
        eq(tickets.status, 'published')
      )
    )
    .limit(1);

  // If not found, try without leading slash or with leading slash
  if (!ticket) {
    const alternateUrl = url.startsWith('/') ? url.slice(1) : `/${url}`;
    [ticket] = await db
      .select()
      .from(tickets)
      .where(
        and(
          eq(tickets.url, alternateUrl),
          eq(tickets.status, 'published')
        )
      )
      .limit(1);
  }

  if (!ticket) return null;

  return getPublicTicketById(ticket.id);
};

// Get events for a ticket
export const getTicketEvents = async (ticketId: number): Promise<PublicEventDetails[]> => {
  const eventIds = await db
    .select({ eventId: ticketEvents.eventId })
    .from(ticketEvents)
    .where(eq(ticketEvents.ticketId, ticketId));

  if (eventIds.length === 0) return [];

  const eventData = await db
    .select()
    .from(events)
    .where(
      and(
        inArray(events.id, eventIds.map(e => e.eventId)),
        inArray(events.status, ['published', 'live'])
      )
    );

  return eventData.map((e) => ({
    id: e.id,
    title: e.title,
    description: e.description || undefined,
    start_datetime: e.startDatetime || new Date(),
    end_datetime: e.endDatetime || new Date(),
    is_vod: e.isVod ?? false,
    status: e.status || 'draft',
    thumbnail_image_portrait: e.thumbnailImagePortrait || undefined,
    featured_image: e.featuredImage || undefined,
    embed: e.embed || undefined,
    watch_link: e.watchLink || undefined,
    archive_after: e.archiveAfter || undefined,
  }));
};

// Get pricing for a ticket
export const getTicketPricing = async (ticketId: number): Promise<PublicTicketPricing[]> => {
  const pricing = await db
    .select()
    .from(ticketPricing)
    .where(eq(ticketPricing.ticketId, ticketId));

  return pricing.map((p) => ({
    currency: p.currency,
    price: parseFloat(p.price),
    is_default: p.isDefault ?? false,
  }));
};

// Get sponsors for a ticket
export const getTicketSponsors = async (ticketId: number): Promise<PublicTicketSponsor[]> => {
  const sponsors = await db
    .select()
    .from(ticketSponsors)
    .where(eq(ticketSponsors.ticketId, ticketId));

  return sponsors.map((s) => ({
    title: s.title || '',
    image_url: s.imageUrl || undefined,
    link: s.link || undefined,
  }));
};

// Helper to map raw data to DashboardTicket
// Get ticket by ID for payment config (includes app_id and tenant_id)
// Used for getting platform-specific payment credentials
export const getTicketByIdForPayment = async (ticketId: number): Promise<{ appId: string; tenantId: string } | null> => {
  const [ticket] = await db
    .select({
      appId: tickets.appId,
      tenantId: tickets.tenantId,
    })
    .from(tickets)
    .where(eq(tickets.id, ticketId))
    .limit(1);

  if (!ticket) return null;

  return {
    appId: ticket.appId,
    tenantId: ticket.tenantId,
  };
};

const mapToDashboardTicket = (row: {
  id: number;
  title: string;
  description: string | null;
  thumbnailImagePortrait: string | null;
  url: string | null;
  createdAt: Date;
}): DashboardTicket => ({
  id: row.id,
  title: row.title,
  description: row.description || undefined,
  thumbnail_image_portrait: row.thumbnailImagePortrait || undefined,
  url: row.url || undefined,
  created_at: row.createdAt,
});
