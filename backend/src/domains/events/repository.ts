// Events repository - tenant-aware database operations using Drizzle ORM
import { eq, and, ilike, or, gte, lte, desc, asc, count, sql } from 'drizzle-orm';
import { db, events } from '../../db/index';
import type {
  Event,
  EventStatus,
  CreateEventRequest,
  UpdateEventRequest,
  EventFilter,
  EventListResponse,
  PaginationParams,
  SortParams,
} from './types';

// Transform database row to API response format
const transformEvent = (event: typeof events.$inferSelect): Event => {
  return {
    id: event.id,
    app_id: event.appId,
    tenant_id: event.tenantId,
    title: event.title,
    description: event.description ?? undefined,
    start_datetime: event.startDatetime ?? new Date(),
    end_datetime: event.endDatetime ?? new Date(),
    language: event.language ?? 'en',
    is_vod: event.isVod ?? false,
    convert_to_vod_after_event: event.convertToVodAfterEvent ?? false,
    vod_url: event.vodUrl ?? undefined,
    vod_video_url: event.vodVideoUrl ?? undefined,
    watch_link: event.watchLink ?? undefined,
    max_concurrent_viewers_per_link: event.maxConcurrentViewersPerLink ?? 1,
    signup_disabled: event.signupDisabled ?? false,
    purchase_disabled: event.purchaseDisabled ?? false,
    embed: event.embed ?? undefined,
    status: (event.status as EventStatus) ?? 'draft',
    watch_upto: event.watchUpto?.toISOString() ?? undefined,
    archive_after: event.archiveAfter ?? undefined,
    thumbnail_image_portrait: event.thumbnailImagePortrait ?? undefined,
    featured_image: event.featuredImage ?? undefined,
    featured_video: event.featuredVideo ?? undefined,
    created_at: event.createdAt,
    updated_at: event.updatedAt,
  };
};

export const createEvent = async (
  appId: string,
  tenantId: string,
  data: CreateEventRequest
): Promise<Event> => {
  const [event] = await db
    .insert(events)
    .values({
      appId,
      tenantId,
      title: data.title,
      description: data.description,
      startDatetime: data.start_datetime,
      endDatetime: data.end_datetime,
      language: data.language || 'en',
      isVod: data.is_vod ?? false,
      convertToVodAfterEvent: data.convert_to_vod_after_event ?? false,
      vodUrl: data.vod_url,
      vodVideoUrl: data.vod_video_url,
      watchLink: data.watch_link,
      maxConcurrentViewersPerLink: data.max_concurrent_viewers_per_link || 1,
      signupDisabled: data.signup_disabled ?? false,
      purchaseDisabled: data.purchase_disabled ?? false,
      embed: data.embed,
      status: data.status || 'draft',
      watchUpto: data.watch_upto ? new Date(data.watch_upto) : undefined,
      archiveAfter: data.archive_after,
      thumbnailImagePortrait: data.thumbnail_image_portrait,
      featuredImage: data.featured_image,
      featuredVideo: data.featured_video,
    })
    .returning();

  return transformEvent(event);
};

export const getEventById = async (
  appId: string,
  tenantId: string,
  eventId: number
): Promise<Event | null> => {
  const [event] = await db
    .select()
    .from(events)
    .where(
      and(
        eq(events.appId, appId),
        eq(events.tenantId, tenantId),
        eq(events.id, eventId)
      )
    )
    .limit(1);

  return event ? transformEvent(event) : null;
};

export const updateEvent = async (
  appId: string,
  tenantId: string,
  eventId: number,
  data: UpdateEventRequest
): Promise<Event | null> => {
  const updates: Partial<typeof events.$inferInsert> = { updatedAt: new Date() };

  if (data.title !== undefined) updates.title = data.title;
  if (data.description !== undefined) updates.description = data.description;
  if (data.start_datetime !== undefined) updates.startDatetime = data.start_datetime;
  if (data.end_datetime !== undefined) updates.endDatetime = data.end_datetime;
  if (data.language !== undefined) updates.language = data.language;
  if (data.is_vod !== undefined) updates.isVod = data.is_vod;
  if (data.convert_to_vod_after_event !== undefined) updates.convertToVodAfterEvent = data.convert_to_vod_after_event;
  if (data.vod_url !== undefined) updates.vodUrl = data.vod_url;
  if (data.vod_video_url !== undefined) updates.vodVideoUrl = data.vod_video_url;
  if (data.watch_link !== undefined) updates.watchLink = data.watch_link;
  if (data.max_concurrent_viewers_per_link !== undefined) updates.maxConcurrentViewersPerLink = data.max_concurrent_viewers_per_link;
  if (data.signup_disabled !== undefined) updates.signupDisabled = data.signup_disabled;
  if (data.purchase_disabled !== undefined) updates.purchaseDisabled = data.purchase_disabled;
  if (data.embed !== undefined) updates.embed = data.embed;
  if (data.status !== undefined) updates.status = data.status;
  if (data.watch_upto !== undefined) updates.watchUpto = new Date(data.watch_upto);
  if (data.archive_after !== undefined) updates.archiveAfter = data.archive_after;
  if (data.thumbnail_image_portrait !== undefined) updates.thumbnailImagePortrait = data.thumbnail_image_portrait;
  if (data.featured_image !== undefined) updates.featuredImage = data.featured_image;
  if (data.featured_video !== undefined) updates.featuredVideo = data.featured_video;

  const [event] = await db
    .update(events)
    .set(updates)
    .where(
      and(
        eq(events.appId, appId),
        eq(events.tenantId, tenantId),
        eq(events.id, eventId)
      )
    )
    .returning();

  return event ? transformEvent(event) : null;
};

export const deleteEvent = async (
  appId: string,
  tenantId: string,
  eventId: number
): Promise<boolean> => {
  const result = await db
    .delete(events)
    .where(
      and(
        eq(events.appId, appId),
        eq(events.tenantId, tenantId),
        eq(events.id, eventId)
      )
    )
    .returning({ id: events.id });

  return result.length > 0;
};

export const listEvents = async (
  appId: string,
  tenantId: string,
  filter: EventFilter = {},
  pagination: PaginationParams = {},
  sort: SortParams = {}
): Promise<EventListResponse> => {
  const page = Math.max(1, pagination.page || 1);
  const pageSize = Math.max(1, Math.min(100, pagination.page_size || 10));
  const offset = (page - 1) * pageSize;

  // Build where conditions
  const conditions = [
    eq(events.appId, appId),
    eq(events.tenantId, tenantId),
  ];

  if (filter.status) {
    conditions.push(eq(events.status, filter.status));
  }
  if (filter.language) {
    conditions.push(eq(events.language, filter.language));
  }
  if (filter.is_vod !== undefined) {
    conditions.push(eq(events.isVod, filter.is_vod));
  }
  if (filter.start_date_from) {
    conditions.push(gte(events.startDatetime, filter.start_date_from));
  }
  if (filter.start_date_to) {
    conditions.push(lte(events.startDatetime, filter.start_date_to));
  }
  if (filter.search) {
    conditions.push(
      or(
        ilike(events.title, `%${filter.search}%`),
        ilike(events.description, `%${filter.search}%`)
      )!
    );
  }

  // Get total count
  const [countResult] = await db
    .select({ count: count() })
    .from(events)
    .where(and(...conditions));

  const total = countResult?.count || 0;

  // Get data with sorting
  const sortBy = sort.sort_by || 'created_at';
  const sortOrder = sort.sort_order || 'desc';
  
  const sortColumn = sortBy === 'created_at' ? events.createdAt 
    : sortBy === 'start_datetime' ? events.startDatetime
    : sortBy === 'title' ? events.title
    : sortBy === 'status' ? events.status
    : events.createdAt;

  const data = await db
    .select()
    .from(events)
    .where(and(...conditions))
    .orderBy(sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn))
    .limit(pageSize)
    .offset(offset);

  return {
    data: data.map(transformEvent),
    total,
    page,
    page_size: pageSize,
    total_pages: Math.ceil(total / pageSize),
  };
};

export const getEventsByIds = async (
  appId: string,
  tenantId: string,
  eventIds: number[]
): Promise<Event[]> => {
  if (eventIds.length === 0) return [];

  const data = await db
    .select()
    .from(events)
    .where(
      and(
        eq(events.appId, appId),
        eq(events.tenantId, tenantId),
        sql`${events.id} = ANY(${eventIds})`
      )
    );

  return data.map(transformEvent);
};

export const updateEventStatus = async (
  appId: string,
  tenantId: string,
  eventId: number,
  status: string
): Promise<boolean> => {
  const result = await db
    .update(events)
    .set({ status, updatedAt: new Date() })
    .where(
      and(
        eq(events.appId, appId),
        eq(events.tenantId, tenantId),
        eq(events.id, eventId)
      )
    )
    .returning({ id: events.id });

  return result.length > 0;
};

// Live/Upcoming events for dashboard
export const getLiveEvents = async (
  appId: string,
  tenantId: string
): Promise<Event[]> => {
  const now = new Date();
  
  const data = await db
    .select()
    .from(events)
    .where(
      and(
        eq(events.appId, appId),
        eq(events.tenantId, tenantId),
        lte(events.startDatetime, now),
        gte(events.endDatetime, now),
        or(eq(events.status, 'published'), eq(events.status, 'live'))
      )
    );

  return data.map(transformEvent);
};

export const getUpcomingEvents = async (
  appId: string,
  tenantId: string,
  limit: number = 10
): Promise<Event[]> => {
  const now = new Date();
  
  const data = await db
    .select()
    .from(events)
    .where(
      and(
        eq(events.appId, appId),
        eq(events.tenantId, tenantId),
        gte(events.startDatetime, now),
        eq(events.status, 'published')
      )
    )
    .orderBy(asc(events.startDatetime))
    .limit(limit);

  return data.map(transformEvent);
};
