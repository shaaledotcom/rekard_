// Tickets repository - tenant-aware database operations using Drizzle ORM
import { eq, and, ilike, or, desc, asc, count, sql, inArray } from 'drizzle-orm';
import { db, tickets, ticketEvents, ticketCoupons, ticketPricing, ticketSponsors, events } from '../../db/index';
import type {
  Ticket,
  TicketStatus,
  TicketCoupon,
  TicketPricing,
  TicketSponsor,
  CreateTicketRequest,
  UpdateTicketRequest,
  TicketFilter,
  TicketListResponse,
  PaginationParams,
  SortParams,
  Event,
  GeoblockingLocation,
} from './types';

// Validate coupon codes for duplicates
const validateCouponCodes = async (
  codes: string[],
  excludeTicketId?: number
): Promise<void> => {
  // Check for duplicates within the array
  const codeSet = new Set<string>();
  const duplicates: string[] = [];
  
  for (const code of codes) {
    const normalizedCode = code.trim().toUpperCase();
    if (codeSet.has(normalizedCode)) {
      duplicates.push(code);
    } else {
      codeSet.add(normalizedCode);
    }
  }
  
  if (duplicates.length > 0) {
    throw new Error(`Duplicate coupon codes found: ${duplicates.join(', ')}`);
  }
  
  // Check if codes already exist in database
  const normalizedCodes = codes.map(c => c.trim().toUpperCase());
  
  let existingCoupons;
  if (excludeTicketId !== undefined) {
    existingCoupons = await db
      .select({ code: ticketCoupons.code, ticketId: ticketCoupons.ticketId })
      .from(ticketCoupons)
      .where(sql`${ticketCoupons.ticketId} != ${excludeTicketId}`);
  } else {
    existingCoupons = await db
      .select({ code: ticketCoupons.code, ticketId: ticketCoupons.ticketId })
      .from(ticketCoupons);
  }
  
  const existing = existingCoupons.filter(coupon => 
    normalizedCodes.includes(coupon.code.trim().toUpperCase())
  );
  
  if (existing.length > 0) {
    const existingCodes = existing.map(e => e.code);
    throw new Error(`Coupon codes already exist: ${existingCodes.join(', ')}`);
  }
};

export const createTicket = async (
  appId: string,
  tenantId: string,
  data: CreateTicketRequest
): Promise<Ticket> => {
  return await db.transaction(async (tx) => {
    // Create ticket
    const [ticket] = await tx
      .insert(tickets)
      .values({
        appId,
        tenantId,
        title: data.title,
        description: data.description,
        url: data.url,
        thumbnailImagePortrait: data.thumbnail_image_portrait,
        featuredImage: data.featured_image,
        featuredVideo: data.featured_video,
        purchaseWithoutLogin: data.purchase_without_login ?? false,
        isFundraiser: data.is_fundraiser ?? false,
        price: data.price?.toString(),
        currency: data.currency || 'INR',
        totalQuantity: data.total_quantity,
        soldQuantity: 0,
        maxQuantityPerUser: data.max_quantity_per_user || 1,
        geoblockingEnabled: data.geoblocking_enabled ?? false,
        geoblockingCountries: data.geoblocking_countries || null,
        status: data.status || 'draft',
      })
      .returning();

    // Link events
    if (data.event_ids && data.event_ids.length > 0) {
      const uniqueEventIds = [...new Set(data.event_ids.map(id => Number(id)))].filter(id => !isNaN(id));
      if (uniqueEventIds.length > 0) {
        await tx.insert(ticketEvents).values(
          uniqueEventIds.map((eventId) => ({
            ticketId: ticket.id,
            eventId,
          }))
        );
      }
    }

    // Create coupons
    if (data.coupons && data.coupons.length > 0) {
      const codes = data.coupons.map((c) => c.code).filter(Boolean);
      await validateCouponCodes(codes);
      
      await tx.insert(ticketCoupons).values(
        data.coupons.map((c) => ({
          ticketId: ticket.id,
          title: c.title,
          code: c.code.trim().toUpperCase(),
          count: c.count,
          activationTime: c.activation_time,
          expiryTime: c.expiry_time,
          discount: c.discount?.toString(),
          usedCount: 0,
          isActive: true,
        }))
      );
    }

    // Create pricing
    if (data.pricing && data.pricing.length > 0) {
      await tx.insert(ticketPricing).values(
        data.pricing.map((p, i) => ({
          ticketId: ticket.id,
          currency: p.currency,
          price: p.price.toString(),
          isDefault: i === 0,
        }))
      );
    }

    // Create sponsors
    if (data.sponsors && data.sponsors.length > 0) {
      await tx.insert(ticketSponsors).values(
        data.sponsors.map((s) => ({
          ticketId: ticket.id,
          title: s.title,
          imageUrl: s.image_url,
          link: s.link,
        }))
      );
    }

    return transformTicket(ticket);
  });
};

// Transform database row to API response format
const transformTicket = (ticket: typeof tickets.$inferSelect): Ticket => {
  return {
    id: ticket.id,
    app_id: ticket.appId,
    tenant_id: ticket.tenantId,
    title: ticket.title,
    description: ticket.description ?? undefined,
    url: ticket.url ?? undefined,
    thumbnail_image_portrait: ticket.thumbnailImagePortrait ?? undefined,
    featured_image: ticket.featuredImage ?? undefined,
    featured_video: ticket.featuredVideo ?? undefined,
    purchase_without_login: ticket.purchaseWithoutLogin ?? false,
    is_fundraiser: ticket.isFundraiser ?? false,
    price: ticket.price ? parseFloat(ticket.price) : 0,
    currency: ticket.currency ?? 'INR',
    total_quantity: ticket.totalQuantity ?? 0,
    sold_quantity: ticket.soldQuantity ?? 0,
    max_quantity_per_user: ticket.maxQuantityPerUser ?? 1,
    geoblocking_enabled: ticket.geoblockingEnabled ?? false,
    geoblocking_countries: (ticket.geoblockingCountries as GeoblockingLocation[]) ?? undefined,
    status: (ticket.status as TicketStatus) ?? 'draft',
    created_at: ticket.createdAt,
    updated_at: ticket.updatedAt,
  };
};

export const getTicketById = async (
  appId: string,
  tenantId: string,
  ticketId: number,
  includeRelations: boolean = false
): Promise<Ticket | null> => {
  const [ticket] = await db
    .select()
    .from(tickets)
    .where(
      and(
        eq(tickets.appId, appId),
        eq(tickets.tenantId, tenantId),
        eq(tickets.id, ticketId)
      )
    )
    .limit(1);

  if (!ticket) return null;

  const result = transformTicket(ticket);

  if (includeRelations) {
    result.events = await getTicketEvents(ticketId);
    result.coupons = await getTicketCoupons(ticketId);
    result.pricing = await getTicketPricing(ticketId);
    result.sponsors = await getTicketSponsors(ticketId);
  }

  return result;
};

export const updateTicket = async (
  appId: string,
  tenantId: string,
  ticketId: number,
  data: UpdateTicketRequest
): Promise<Ticket | null> => {
  return await db.transaction(async (tx) => {
    const updates: Partial<typeof tickets.$inferInsert> = { updatedAt: new Date() };

    if (data.title !== undefined) updates.title = data.title;
    if (data.description !== undefined) updates.description = data.description;
    if (data.url !== undefined) updates.url = data.url;
    if (data.thumbnail_image_portrait !== undefined) updates.thumbnailImagePortrait = data.thumbnail_image_portrait;
    if (data.featured_image !== undefined) updates.featuredImage = data.featured_image;
    if (data.featured_video !== undefined) updates.featuredVideo = data.featured_video;
    if (data.purchase_without_login !== undefined) updates.purchaseWithoutLogin = data.purchase_without_login;
    if (data.is_fundraiser !== undefined) updates.isFundraiser = data.is_fundraiser;
    if (data.price !== undefined) updates.price = data.price?.toString();
    if (data.currency !== undefined) updates.currency = data.currency;
    if (data.total_quantity !== undefined) updates.totalQuantity = data.total_quantity;
    if (data.max_quantity_per_user !== undefined) updates.maxQuantityPerUser = data.max_quantity_per_user;
    if (data.geoblocking_enabled !== undefined) updates.geoblockingEnabled = data.geoblocking_enabled;
    if (data.geoblocking_countries !== undefined) updates.geoblockingCountries = data.geoblocking_countries;
    if (data.status !== undefined) updates.status = data.status;

    const [ticket] = await tx
      .update(tickets)
      .set(updates)
      .where(
        and(
          eq(tickets.appId, appId),
          eq(tickets.tenantId, tenantId),
          eq(tickets.id, ticketId)
        )
      )
      .returning();

    if (!ticket) return null;

    // Update event links
    if (data.event_ids !== undefined) {
      await tx.delete(ticketEvents).where(eq(ticketEvents.ticketId, ticketId));
      const uniqueEventIds = [...new Set(data.event_ids.map(id => Number(id)))].filter(id => !isNaN(id));
      if (uniqueEventIds.length > 0) {
        await tx.insert(ticketEvents).values(
          uniqueEventIds.map((eventId) => ({
            ticketId,
            eventId,
          }))
        );
      }
    }

    // Update coupons
    if (data.coupons !== undefined) {
      await tx.delete(ticketCoupons).where(eq(ticketCoupons.ticketId, ticketId));
      if (data.coupons.length > 0) {
        const codes = data.coupons.map((c) => c.code).filter(Boolean);
        await validateCouponCodes(codes, ticketId);
        
        await tx.insert(ticketCoupons).values(
          data.coupons.map((c) => ({
            ticketId,
            title: c.title,
            code: c.code.trim().toUpperCase(),
            count: c.count,
            activationTime: c.activation_time,
            expiryTime: c.expiry_time,
            discount: c.discount?.toString(),
            usedCount: 0,
            isActive: true,
          }))
        );
      }
    }

    // Update pricing
    if (data.pricing !== undefined) {
      await tx.delete(ticketPricing).where(eq(ticketPricing.ticketId, ticketId));
      if (data.pricing.length > 0) {
        await tx.insert(ticketPricing).values(
          data.pricing.map((p, i) => ({
            ticketId,
            currency: p.currency,
            price: p.price.toString(),
            isDefault: i === 0,
          }))
        );
      }
    }

    // Update sponsors
    if (data.sponsors !== undefined) {
      await tx.delete(ticketSponsors).where(eq(ticketSponsors.ticketId, ticketId));
      if (data.sponsors.length > 0) {
      await tx.insert(ticketSponsors).values(
        data.sponsors.map((s) => ({
          ticketId,
          title: s.title,
          imageUrl: s.image_url,
          link: s.link,
        }))
      );
      }
    }

    return transformTicket(ticket);
  });
};

export const deleteTicket = async (
  appId: string,
  tenantId: string,
  ticketId: number
): Promise<boolean> => {
  return await db.transaction(async (tx) => {
    // Delete related records (cascade should handle this, but being explicit)
    await tx.delete(ticketEvents).where(eq(ticketEvents.ticketId, ticketId));
    await tx.delete(ticketCoupons).where(eq(ticketCoupons.ticketId, ticketId));
    await tx.delete(ticketPricing).where(eq(ticketPricing.ticketId, ticketId));
    await tx.delete(ticketSponsors).where(eq(ticketSponsors.ticketId, ticketId));

    const result = await tx
      .delete(tickets)
      .where(
        and(
          eq(tickets.appId, appId),
          eq(tickets.tenantId, tenantId),
          eq(tickets.id, ticketId)
        )
      )
      .returning({ id: tickets.id });

    return result.length > 0;
  });
};

export const listTickets = async (
  appId: string,
  tenantId: string,
  filter: TicketFilter = {},
  pagination: PaginationParams = {},
  sort: SortParams = {}
): Promise<TicketListResponse> => {
  const page = Math.max(1, pagination.page || 1);
  const pageSize = Math.max(1, Math.min(100, pagination.page_size || 10));
  const offset = (page - 1) * pageSize;

  const conditions = [
    eq(tickets.appId, appId),
    eq(tickets.tenantId, tenantId),
  ];

  if (filter.status) {
    conditions.push(eq(tickets.status, filter.status));
  }
  if (filter.search) {
    conditions.push(
      or(
        ilike(tickets.title, `%${filter.search}%`),
        ilike(tickets.description, `%${filter.search}%`)
      )!
    );
  }
  if (filter.event_id) {
    const ticketIds = await db
      .select({ ticketId: ticketEvents.ticketId })
      .from(ticketEvents)
      .where(eq(ticketEvents.eventId, filter.event_id));
    
    if (ticketIds.length > 0) {
      conditions.push(inArray(tickets.id, ticketIds.map(t => t.ticketId)));
    } else {
      // No tickets for this event
      return { data: [], total: 0, page, page_size: pageSize, total_pages: 0 };
    }
  }

  const [countResult] = await db
    .select({ count: count() })
    .from(tickets)
    .where(and(...conditions));

  const total = countResult?.count || 0;

  const sortBy = sort.sort_by || 'created_at';
  const sortOrder = sort.sort_order || 'desc';
  
  const sortColumn = sortBy === 'created_at' ? tickets.createdAt 
    : sortBy === 'title' ? tickets.title
    : sortBy === 'price' ? tickets.price
    : sortBy === 'status' ? tickets.status
    : tickets.createdAt;

  const data = await db
    .select()
    .from(tickets)
    .where(and(...conditions))
    .orderBy(sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn))
    .limit(pageSize)
    .offset(offset);

  return {
    data: data.map(transformTicket),
    total,
    page,
    page_size: pageSize,
    total_pages: Math.ceil(total / pageSize),
  };
};

// Relation queries
export const getTicketEvents = async (ticketId: number): Promise<Event[]> => {
  const eventIds = await db
    .select({ eventId: ticketEvents.eventId })
    .from(ticketEvents)
    .where(eq(ticketEvents.ticketId, ticketId));

  if (eventIds.length === 0) return [];

  const eventData = await db
    .select({
      id: events.id,
      title: events.title,
      startDatetime: events.startDatetime,
      endDatetime: events.endDatetime,
      status: events.status,
    })
    .from(events)
    .where(inArray(events.id, eventIds.map(e => e.eventId)));

  return eventData.map(e => ({
    id: e.id,
    title: e.title,
    start_datetime: e.startDatetime,
    end_datetime: e.endDatetime,
    status: e.status,
  })) as Event[];
};

export const getTicketCoupons = async (ticketId: number): Promise<TicketCoupon[]> => {
  const coupons = await db
    .select()
    .from(ticketCoupons)
    .where(eq(ticketCoupons.ticketId, ticketId));

  return coupons.map(c => ({
    id: c.id,
    ticket_id: c.ticketId,
    title: c.title ?? '',
    code: c.code,
    count: c.count ?? 0,
    activation_time: c.activationTime ?? undefined,
    expiry_time: c.expiryTime ?? undefined,
    discount: c.discount ? parseFloat(c.discount) : 0,
    used_count: c.usedCount ?? 0,
    is_active: c.isActive ?? true,
    created_at: c.createdAt,
    updated_at: c.updatedAt,
  }));
};

export const getTicketPricing = async (ticketId: number): Promise<TicketPricing[]> => {
  const pricing = await db
    .select()
    .from(ticketPricing)
    .where(eq(ticketPricing.ticketId, ticketId));

  return pricing.map(p => ({
    id: p.id,
    ticket_id: p.ticketId,
    currency: p.currency,
    price: parseFloat(p.price),
    is_default: p.isDefault ?? false,
    created_at: p.createdAt,
    updated_at: p.updatedAt,
  }));
};

export const getTicketSponsors = async (ticketId: number): Promise<TicketSponsor[]> => {
  const sponsors = await db
    .select()
    .from(ticketSponsors)
    .where(eq(ticketSponsors.ticketId, ticketId));

  return sponsors.map(s => ({
    id: s.id,
    ticket_id: s.ticketId,
    title: s.title ?? '',
    image_url: s.imageUrl ?? undefined,
    link: s.link ?? undefined,
    created_at: s.createdAt,
    updated_at: s.updatedAt,
  }));
};

// Sold quantity management
export const incrementSoldQuantity = async (
  ticketId: number,
  quantity: number
): Promise<boolean> => {
  const result = await db
    .update(tickets)
    .set({ 
      soldQuantity: sql`${tickets.soldQuantity} + ${quantity}`,
      updatedAt: new Date()
    })
    .where(eq(tickets.id, ticketId))
    .returning({ id: tickets.id });

  return result.length > 0;
};

export const decrementSoldQuantity = async (
  ticketId: number,
  quantity: number
): Promise<boolean> => {
  const result = await db
    .update(tickets)
    .set({ 
      soldQuantity: sql`${tickets.soldQuantity} - ${quantity}`,
      updatedAt: new Date()
    })
    .where(eq(tickets.id, ticketId))
    .returning({ id: tickets.id });

  return result.length > 0;
};

// Coupon operations
export const getCouponByCode = async (
  appId: string,
  tenantId: string,
  ticketId: number,
  code: string
): Promise<TicketCoupon | null> => {
  // Normalize the code to match how it's stored (uppercase, trimmed)
  const normalizedCode = code.trim().toUpperCase();

  // First get the ticket by ID (for viewer routes, we need to resolve tenant from ticket)
  // Try with provided tenant first, then fall back to ticket's actual tenant
  let [ticket] = await db
    .select()
    .from(tickets)
    .where(
      and(
        eq(tickets.appId, appId),
        eq(tickets.tenantId, tenantId),
        eq(tickets.id, ticketId)
      )
    )
    .limit(1);

  // If not found with provided tenant (e.g., viewer route with system tenant),
  // try to get ticket by ID only and use its actual tenant
  if (!ticket) {
    [ticket] = await db
      .select()
      .from(tickets)
      .where(eq(tickets.id, ticketId))
      .limit(1);

    if (ticket) {
      // Use the ticket's actual tenant for coupon lookup
      appId = ticket.appId;
      tenantId = ticket.tenantId;
    }
  }

  if (!ticket) {
    return null;
  }

  // Query coupon - use SQL with TRIM and UPPER for exact matching
  // This handles any edge cases with whitespace or casing
  const [coupon] = await db
    .select()
    .from(ticketCoupons)
    .where(
      and(
        eq(ticketCoupons.ticketId, ticketId),
        sql`TRIM(UPPER(${ticketCoupons.code})) = TRIM(UPPER(${sql.raw(`'${normalizedCode.replace(/'/g, "''")}'`)}))`
      )
    )
    .limit(1);

  if (!coupon) {
    return null;
  }

  return {
    id: coupon.id,
    ticket_id: coupon.ticketId,
    title: coupon.title ?? '',
    code: coupon.code,
    count: coupon.count ?? 0,
    activation_time: coupon.activationTime ?? undefined,
    expiry_time: coupon.expiryTime ?? undefined,
    discount: coupon.discount ? parseFloat(coupon.discount) : 0,
    used_count: coupon.usedCount ?? 0,
    is_active: coupon.isActive ?? true,
    created_at: coupon.createdAt,
    updated_at: coupon.updatedAt,
  };
};

export const incrementCouponUsage = async (couponId: number): Promise<boolean> => {
  const result = await db
    .update(ticketCoupons)
    .set({ 
      usedCount: sql`${ticketCoupons.usedCount} + 1`,
      updatedAt: new Date()
    })
    .where(eq(ticketCoupons.id, couponId))
    .returning({ id: ticketCoupons.id });

  return result.length > 0;
};

// Get tickets by event
export const getTicketsByEventId = async (
  appId: string,
  tenantId: string,
  eventId: number
): Promise<Ticket[]> => {
  const ticketIds = await db
    .select({ ticketId: ticketEvents.ticketId })
    .from(ticketEvents)
    .where(eq(ticketEvents.eventId, eventId));

  if (ticketIds.length === 0) return [];

  const data = await db
    .select()
    .from(tickets)
    .where(
      and(
        eq(tickets.appId, appId),
        eq(tickets.tenantId, tenantId),
        inArray(tickets.id, ticketIds.map(t => t.ticketId))
      )
    );

  return data.map(transformTicket);
};

// Get all tickets that contain a specific event
export const getTicketsContainingEvent = async (
  appId: string,
  tenantId: string,
  eventId: number
): Promise<{ ticket: Ticket; events: Event[] }[]> => {
  const ticketIds = await db
    .select({ ticketId: ticketEvents.ticketId })
    .from(ticketEvents)
    .where(eq(ticketEvents.eventId, eventId));

  if (ticketIds.length === 0) return [];

  const ticketData = await db
    .select()
    .from(tickets)
    .where(
      and(
        eq(tickets.appId, appId),
        eq(tickets.tenantId, tenantId),
        inArray(tickets.id, ticketIds.map(t => t.ticketId))
      )
    );

  const result: { ticket: Ticket; events: Event[] }[] = [];
  
  for (const ticket of ticketData) {
    const ticketEventsData = await getTicketEvents(ticket.id);
    result.push({
      ticket: transformTicket(ticket),
      events: ticketEventsData,
    });
  }

  return result;
};

// Archive ticket
export const archiveTicketById = async (
  appId: string,
  tenantId: string,
  ticketId: number
): Promise<boolean> => {
  const result = await db
    .update(tickets)
    .set({ status: 'archived', updatedAt: new Date() })
    .where(
      and(
        eq(tickets.appId, appId),
        eq(tickets.tenantId, tenantId),
        eq(tickets.id, ticketId)
      )
    )
    .returning({ id: tickets.id });

  return result.length > 0;
};
