import { api } from "./baseApi";

// Ticket types
export type TicketStatus = "draft" | "published" | "sold_out" | "archived";

export interface GeoblockingLocation {
  type: "country" | "city" | "state" | "pincode" | "coordinates";
  value: string | [number, number];
  country_code?: string;  // context for city/state/pincode (which country)
  radius_km?: number;     // only for coordinates
  name?: string;          // human-readable label for UI
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
  link?: string;
}

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
  is_fundraiser: boolean;
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
  link?: string;
}

export interface CreateTicketRequest {
  title: string;
  description?: string;
  url?: string;
  thumbnail_image_portrait?: string;
  featured_image?: string;
  featured_video?: string;
  purchase_without_login?: boolean;
  is_fundraiser?: boolean;
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
  is_fundraiser?: boolean;
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

// Tickets API endpoints
export const ticketsApi = api.injectEndpoints({
  endpoints: (builder) => ({
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

// Export hooks
export const {
  useGetTicketsQuery,
  useGetTicketQuery,
  useCreateTicketMutation,
  useUpdateTicketMutation,
  useDeleteTicketMutation,
  usePublishTicketMutation,
  useArchiveTicketMutation,
} = ticketsApi;

