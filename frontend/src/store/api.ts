import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "./store";
import { config } from "@/lib/config";

// Base query with auth header injection
const baseQuery = fetchBaseQuery({
  baseUrl: config.apiUrl,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    // Add service type header for backend role assignment
    headers.set("X-Service", "producer");
    return headers;
  },
  credentials: "include",
});

// API slice with RTK Query
export const api = createApi({
  reducerPath: "api",
  baseQuery,
  tagTypes: [
    "User",
    "Events",
    "Tickets",
    "Orders",
    "Billing",
    "Configuration",
    "Platform",
    "Currency",
  ],
  endpoints: (builder) => ({
    // Protected routes
    getMe: builder.query<UserResponse, void>({
      query: () => "/v1/protected/me",
      providesTags: ["User"],
    }),
    getPreferences: builder.query<PreferencesResponse, void>({
      query: () => "/v1/protected/preferences",
    }),
    updatePreferences: builder.mutation<PreferencesResponse, UpdatePreferencesRequest>({
      query: (body) => ({
        url: "/v1/preferences",
        method: "PUT",
        body,
      }),
    }),

    // Health check
    healthCheck: builder.query<HealthResponse, void>({
      query: () => "/health",
    }),

    // Events - Producer routes
    getEvents: builder.query<EventListResponse, EventQueryParams | void>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.append("page", params.page.toString());
        if (params?.page_size) searchParams.append("page_size", params.page_size.toString());
        if (params?.status) searchParams.append("status", params.status);
        if (params?.search) searchParams.append("search", params.search);
        if (params?.sort_by) searchParams.append("sort_by", params.sort_by);
        if (params?.sort_order) searchParams.append("sort_order", params.sort_order);
        const queryString = searchParams.toString();
        return `/v1/producer/events${queryString ? `?${queryString}` : ""}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: "Events" as const, id })),
              { type: "Events", id: "LIST" },
            ]
          : [{ type: "Events", id: "LIST" }],
    }),

    getEvent: builder.query<EventResponse, number>({
      query: (id) => `/v1/producer/events/${id}`,
      providesTags: (result, error, id) => [{ type: "Events", id }],
    }),

    createEvent: builder.mutation<EventResponse, CreateEventRequest>({
      query: (body) => ({
        url: "/v1/producer/events",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Events", id: "LIST" }],
    }),

    updateEvent: builder.mutation<EventResponse, { id: number; data: UpdateEventRequest }>({
      query: ({ id, data }) => ({
        url: `/v1/producer/events/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Events", id },
        { type: "Events", id: "LIST" },
      ],
    }),

    deleteEvent: builder.mutation<void, number>({
      query: (id) => ({
        url: `/v1/producer/events/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Events", id: "LIST" }],
    }),

    publishEvent: builder.mutation<EventResponse, number>({
      query: (id) => ({
        url: `/v1/producer/events/${id}/publish`,
        method: "POST",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Events", id },
        { type: "Events", id: "LIST" },
      ],
    }),

    cancelEvent: builder.mutation<EventResponse, number>({
      query: (id) => ({
        url: `/v1/producer/events/${id}/cancel`,
        method: "POST",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Events", id },
        { type: "Events", id: "LIST" },
      ],
    }),

    completeEvent: builder.mutation<EventResponse, number>({
      query: (id) => ({
        url: `/v1/producer/events/${id}/complete`,
        method: "POST",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Events", id },
        { type: "Events", id: "LIST" },
      ],
    }),

    // Tickets - Producer routes
    getTickets: builder.query<TicketListResponse, TicketQueryParams | void>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.append("page", params.page.toString());
        if (params?.page_size) searchParams.append("page_size", params.page_size.toString());
        if (params?.status) searchParams.append("status", params.status);
        if (params?.search) searchParams.append("search", params.search);
        if (params?.event_id) searchParams.append("event_id", params.event_id.toString());
        if (params?.sort_by) searchParams.append("sort_by", params.sort_by);
        if (params?.sort_order) searchParams.append("sort_order", params.sort_order);
        const queryString = searchParams.toString();
        return `/v1/producer/tickets${queryString ? `?${queryString}` : ""}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: "Tickets" as const, id })),
              { type: "Tickets", id: "LIST" },
            ]
          : [{ type: "Tickets", id: "LIST" }],
    }),

    getTicket: builder.query<TicketResponse, number>({
      query: (id) => `/v1/producer/tickets/${id}`,
      providesTags: (result, error, id) => [{ type: "Tickets", id }],
    }),

    createTicket: builder.mutation<TicketResponse, CreateTicketRequest>({
      query: (body) => ({
        url: "/v1/producer/tickets",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Tickets", id: "LIST" }],
    }),

    updateTicket: builder.mutation<TicketResponse, { id: number; data: UpdateTicketRequest }>({
      query: ({ id, data }) => ({
        url: `/v1/producer/tickets/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Tickets", id },
        { type: "Tickets", id: "LIST" },
      ],
    }),

    deleteTicket: builder.mutation<void, number>({
      query: (id) => ({
        url: `/v1/producer/tickets/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Tickets", id: "LIST" }],
    }),

    publishTicket: builder.mutation<TicketResponse, number>({
      query: (id) => ({
        url: `/v1/producer/tickets/${id}/publish`,
        method: "POST",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Tickets", id },
        { type: "Tickets", id: "LIST" },
      ],
    }),

    archiveTicket: builder.mutation<TicketResponse, number>({
      query: (id) => ({
        url: `/v1/producer/tickets/${id}/archive`,
        method: "POST",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Tickets", id },
        { type: "Tickets", id: "LIST" },
      ],
    }),
  }),
});

// Types
export interface UserResponse {
  success: boolean;
  data: {
    id: string;
    email: string;
    phoneNumber: string;
    role: string;
    roles: string[];
    permissions: string[];
    app_id: string;
    tenant_ids: string[];
  };
  message: string;
}

export interface PreferencesResponse {
  success: boolean;
  data: {
    id: string;
    user_id: string;
    theme: string;
    language: string;
    timezone: string;
    notifications_enabled: boolean;
    created_at: string;
    updated_at: string;
  };
  message: string;
}

export interface UpdatePreferencesRequest {
  theme?: string;
  language?: string;
  timezone?: string;
  notifications_enabled?: boolean;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
}

// Event types
export type EventStatus = "draft" | "published" | "live" | "completed" | "cancelled";

export interface Event {
  id: number;
  app_id: string;
  tenant_id: string;
  title: string;
  description?: string;
  start_datetime: string;
  end_datetime: string;
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
  archive_after?: string;
  thumbnail_image_portrait?: string;
  featured_image?: string;
  featured_video?: string;
  created_at: string;
  updated_at: string;
}

export interface EventListResponse {
  success: boolean;
  data: Event[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface EventResponse {
  success: boolean;
  data: Event;
  message?: string;
}

export interface EventQueryParams {
  page?: number;
  page_size?: number;
  status?: EventStatus;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

export interface CreateEventRequest {
  title: string;
  description?: string;
  start_datetime: string;
  end_datetime: string;
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
  archive_after?: string;
  thumbnail_image_portrait?: string;
  featured_image?: string;
  featured_video?: string;
}

export interface UpdateEventRequest {
  title?: string;
  description?: string;
  start_datetime?: string;
  end_datetime?: string;
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
  archive_after?: string;
  thumbnail_image_portrait?: string;
  featured_image?: string;
  featured_video?: string;
}

// Ticket types
export type TicketStatus = "draft" | "published" | "sold_out" | "archived";

export interface Ticket {
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
  created_at: string;
  updated_at: string;
  events?: TicketEvent[];
  coupons?: TicketCoupon[];
  pricing?: TicketPricing[];
  sponsors?: TicketSponsor[];
}

export interface GeoblockingLocation {
  type: "country" | "city" | "state" | "pincode" | "coordinates";
  value: string | [number, number];
  radius_km?: number;
  name?: string;
}

export interface TicketEvent {
  id: number;
  title: string;
  start_datetime: string;
  end_datetime: string;
  status: string;
}

export interface TicketCoupon {
  id: number;
  ticket_id: number;
  title: string;
  code: string;
  count: number;
  activation_time?: string;
  expiry_time?: string;
  discount: number;
  used_count: number;
  is_active: boolean;
}

export interface TicketPricing {
  id: number;
  ticket_id: number;
  currency: string;
  price: number;
  is_default: boolean;
}

export interface TicketSponsor {
  id: number;
  ticket_id: number;
  title: string;
  image_url?: string;
}

export interface TicketListResponse {
  success: boolean;
  data: Ticket[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface TicketResponse {
  success: boolean;
  data: Ticket;
  message?: string;
}

export interface TicketQueryParams {
  page?: number;
  page_size?: number;
  status?: TicketStatus;
  search?: string;
  event_id?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

export interface CouponFormRequest {
  title: string;
  code: string;
  count: number;
  activation_time?: string;
  expiry_time?: string;
  discount: number;
}

export interface PricingFormRequest {
  currency: string;
  price: number;
}

export interface SponsorFormRequest {
  title: string;
  image_url?: string;
}

export interface CreateTicketRequest {
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
  coupons?: CouponFormRequest[];
  pricing?: PricingFormRequest[];
  sponsors?: SponsorFormRequest[];
}

export interface UpdateTicketRequest {
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
  coupons?: CouponFormRequest[];
  pricing?: PricingFormRequest[];
  sponsors?: SponsorFormRequest[];
}

// Export hooks
export const {
  useGetMeQuery,
  useGetPreferencesQuery,
  useUpdatePreferencesMutation,
  useHealthCheckQuery,
  // Events hooks
  useGetEventsQuery,
  useGetEventQuery,
  useCreateEventMutation,
  useUpdateEventMutation,
  useDeleteEventMutation,
  usePublishEventMutation,
  useCancelEventMutation,
  useCompleteEventMutation,
  // Tickets hooks
  useGetTicketsQuery,
  useGetTicketQuery,
  useCreateTicketMutation,
  useUpdateTicketMutation,
  useDeleteTicketMutation,
  usePublishTicketMutation,
  useArchiveTicketMutation,
} = api;

