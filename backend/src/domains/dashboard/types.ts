// Dashboard domain types

export type DashboardTicket = {
  id: number;
  title: string;
  description?: string;
  thumbnail_image_portrait?: string;
  url?: string;
  created_at: Date;
  start_datetime?: Date;
  event_count?: number;
  type?: 'live' | 'upcoming' | 'on_demand';
};

export type DashboardTicketFilter = {
  live_only?: boolean;
  upcoming_only?: boolean;
  on_demand_only?: boolean;
  now?: Date;
};

export type DashboardListResponse = {
  data: DashboardTicket[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

export type DashboardResponse = {
  live: DashboardListResponse;
  upcoming: DashboardListResponse;
  on_demand: DashboardListResponse;
};

export type DashboardPaginationParams = {
  live_page?: number;
  live_page_size?: number;
  upcoming_page?: number;
  upcoming_page_size?: number;
  on_demand_page?: number;
  on_demand_page_size?: number;
};

export type PaginationParams = {
  page?: number;
  page_size?: number;
};

export type SortParams = {
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
};

// Public ticket details (for unauthenticated access)
export type PublicTicketDetails = {
  id: number;
  title: string;
  description?: string;
  url?: string;
  thumbnail_image_portrait?: string;
  featured_image?: string;
  featured_video?: string;
  is_fundraiser: boolean;
  price: number;
  currency: string;
  total_quantity: number;
  sold_quantity: number;
  status: string;
  geoblocking_enabled: boolean;
  geoblocking_countries?: import('../geolocation/types.js').GeoblockingRule[];
  events?: PublicEventDetails[];
  pricing?: PublicTicketPricing[];
  sponsors?: PublicTicketSponsor[];
};

export type PublicEventDetails = {
  id: number;
  title: string;
  description?: string;
  start_datetime: Date;
  end_datetime: Date;
  is_vod: boolean;
  status: string;
  thumbnail_image_portrait?: string;
  featured_image?: string;
  embed?: string;
  watch_link?: string;
  archive_after?: Date;
};

export type PublicTicketPricing = {
  currency: string;
  price: number;
  is_default: boolean;
};

export type PublicTicketSponsor = {
  title: string;
  image_url?: string;
  link?: string;
};

