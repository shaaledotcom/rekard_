// Tickets domain types

export type LocationType = 'country' | 'city' | 'state' | 'pincode' | 'coordinates';

export type GeoblockingLocation = {
  type: LocationType;
  value: string | [number, number]; // string for country/city/state/pincode, [lat,lng] for coordinates
  radius_km?: number;
  name?: string;
};

export type Ticket = {
  id: number;
  app_id: string;
  tenant_id: string;
  title: string;
  description?: string;
  url?: string;
  thumbnail_image_portrait?: string;
  featured_image?: string;
  featured_video?: string;
  purchase_without_login: boolean;
  price: number;
  currency: string;
  total_quantity: number;
  sold_quantity: number;
  max_quantity_per_user: number;
  geoblocking_enabled: boolean;
  geoblocking_countries?: GeoblockingLocation[];
  status: TicketStatus;
  created_at: Date;
  updated_at: Date;
  // Relations (populated separately)
  events?: Event[];
  coupons?: TicketCoupon[];
  pricing?: TicketPricing[];
  sponsors?: TicketSponsor[];
};

export type TicketStatus = 'draft' | 'published' | 'sold_out' | 'archived';

export type TicketCoupon = {
  id: number;
  ticket_id: number;
  title: string;
  code: string;
  count: number;
  activation_time?: Date;
  expiry_time?: Date;
  discount: number;
  used_count: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
};

export type TicketPricing = {
  id: number;
  ticket_id: number;
  currency: string;
  price: number;
  is_default: boolean;
  created_at: Date;
  updated_at: Date;
};

export type TicketSponsor = {
  id: number;
  ticket_id: number;
  title: string;
  image_url?: string;
  created_at: Date;
  updated_at: Date;
};

export type TicketEvent = {
  id: number;
  ticket_id: number;
  event_id: number;
  created_at: Date;
};

// Import Event type for relations
export type Event = {
  id: number;
  title: string;
  start_datetime: Date;
  end_datetime: Date;
  status: string;
};

// Request types
export type CouponForm = {
  title: string;
  code: string;
  count: number;
  activation_time?: Date;
  expiry_time?: Date;
  discount: number;
};

export type PricingForm = {
  currency: string;
  price: number;
};

export type SponsorForm = {
  title: string;
  image_url?: string;
};

export type CreateTicketRequest = {
  title: string;
  description?: string;
  url?: string;
  thumbnail_image_portrait?: string;
  featured_image?: string;
  featured_video?: string;
  purchase_without_login?: boolean;
  price: number;
  currency?: string;
  total_quantity: number;
  max_quantity_per_user?: number;
  geoblocking_enabled?: boolean;
  geoblocking_countries?: GeoblockingLocation[];
  status?: TicketStatus;
  event_ids?: number[];
  coupons?: CouponForm[];
  pricing?: PricingForm[];
  sponsors?: SponsorForm[];
};

export type UpdateTicketRequest = {
  title?: string;
  description?: string;
  url?: string;
  thumbnail_image_portrait?: string;
  featured_image?: string;
  featured_video?: string;
  purchase_without_login?: boolean;
  price?: number;
  currency?: string;
  total_quantity?: number;
  max_quantity_per_user?: number;
  geoblocking_enabled?: boolean;
  geoblocking_countries?: GeoblockingLocation[];
  status?: TicketStatus;
  event_ids?: number[];
  coupons?: CouponForm[];
  pricing?: PricingForm[];
  sponsors?: SponsorForm[];
};

export type TicketFilter = {
  status?: TicketStatus;
  search?: string;
  event_id?: number;
};

export type TicketListResponse = {
  data: Ticket[];
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

// Coupon validation
export type ValidateCouponResult = {
  valid: boolean;
  coupon?: TicketCoupon;
  discount_amount?: number;
  error?: string;
};

