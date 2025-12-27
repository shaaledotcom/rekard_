// Events domain types

export type Event = {
  id: number;
  app_id: string;
  tenant_id: string;
  title: string;
  description?: string;
  start_datetime: Date;
  end_datetime: Date;
  language: string;
  is_vod: boolean;
  convert_to_vod_after_event: boolean;
  vod_url?: string;
  vod_video_url?: string;
  watch_link?: string;
  max_concurrent_viewers_per_link: number;
  signup_disabled: boolean;
  purchase_disabled: boolean;
  embed?: string;
  status: EventStatus;
  watch_upto?: string;
  archive_after?: Date;
  thumbnail_image_portrait?: string;
  featured_image?: string;
  featured_video?: string;
  created_at: Date;
  updated_at: Date;
};

export type EventStatus = 'draft' | 'published' | 'live' | 'completed' | 'cancelled' | 'archived';

export const VALID_EVENT_STATUSES: EventStatus[] = ['draft', 'published', 'live', 'completed', 'cancelled', 'archived'];

export type CreateEventRequest = {
  title: string;
  description?: string;
  start_datetime: Date;
  end_datetime: Date;
  language?: string;
  is_vod?: boolean;
  convert_to_vod_after_event?: boolean;
  vod_url?: string;
  vod_video_url?: string;
  watch_link?: string;
  max_concurrent_viewers_per_link?: number;
  signup_disabled?: boolean;
  purchase_disabled?: boolean;
  embed?: string;
  status?: EventStatus;
  watch_upto?: string;
  archive_after?: Date;
  thumbnail_image_portrait?: string;
  featured_image?: string;
  featured_video?: string;
};

export type UpdateEventRequest = {
  title?: string;
  description?: string;
  start_datetime?: Date;
  end_datetime?: Date;
  language?: string;
  is_vod?: boolean;
  convert_to_vod_after_event?: boolean;
  vod_url?: string;
  vod_video_url?: string;
  watch_link?: string;
  max_concurrent_viewers_per_link?: number;
  signup_disabled?: boolean;
  purchase_disabled?: boolean;
  embed?: string;
  status?: EventStatus;
  watch_upto?: string;
  archive_after?: Date;
  thumbnail_image_portrait?: string;
  featured_image?: string;
  featured_video?: string;
};

export type EventFilter = {
  status?: EventStatus;
  language?: string;
  is_vod?: boolean;
  start_date_from?: Date;
  start_date_to?: Date;
  search?: string;
};

export type EventListResponse = {
  data: Event[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

export type PaginationParams = {
  page?: number;
  page_size?: number;
};

export type SortParams = {
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
};

// Related events
export type RelatedEvent = {
  id: number;
  event_id: number;
  related_event_id: number;
  relationship_type: string;
  created_at: Date;
};

