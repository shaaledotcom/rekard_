import { api } from "./baseApi";

// Types for dashboard data
export interface DashboardTicket {
  id: number;
  title: string;
  description?: string;
  thumbnail_image_portrait?: string;
  url?: string;
  created_at: string;
}

export interface DashboardListResponse {
  data: DashboardTicket[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface DashboardResponse {
  live: DashboardListResponse;
  upcoming: DashboardListResponse;
  on_demand: DashboardListResponse;
}

export interface PublicEventDetails {
  id: number;
  title: string;
  description?: string;
  start_datetime: string;
  end_datetime: string;
  is_vod: boolean;
  status: string;
  thumbnail_image_portrait?: string;
  featured_image?: string;
  embed?: string;
  watch_link?: string;
  archive_after?: string;
}

export interface PublicTicketPricing {
  currency: string;
  price: number;
  is_default: boolean;
}

export interface PublicTicketSponsor {
  title: string;
  image_url?: string;
  link?: string;
}

export interface GeoblockingRule {
  type: "country" | "city" | "state" | "pincode" | "coordinates";
  value: string | [number, number];
  country_code?: string;
  radius_km?: number;
  name?: string;
}

export interface PublicTicketDetails {
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
  geoblocking_countries?: GeoblockingRule[];
  events: PublicEventDetails[];
  pricing: PublicTicketPricing[];
  sponsors: PublicTicketSponsor[];
}

// Wrapper type for API responses
interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export const dashboardApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Get full dashboard
    getDashboard: builder.query<
      DashboardResponse,
      {
        live_page?: number;
        live_page_size?: number;
        upcoming_page?: number;
        upcoming_page_size?: number;
        on_demand_page?: number;
        on_demand_page_size?: number;
      }
    >({
      query: (params) => ({
        url: "/v1/discover/dashboard",
        params,
      }),
      transformResponse: (response: ApiResponse<DashboardResponse>) =>
        response.data,
      providesTags: ["Dashboard"],
    }),

    // Get live tickets
    getLiveTickets: builder.query<
      DashboardListResponse,
      { page?: number; page_size?: number }
    >({
      query: (params) => ({
        url: "/v1/discover/dashboard/live",
        params,
      }),
      transformResponse: (response: ApiResponse<DashboardListResponse>) =>
        response.data,
      providesTags: ["Dashboard"],
    }),

    // Get upcoming tickets
    getUpcomingTickets: builder.query<
      DashboardListResponse,
      { page?: number; page_size?: number }
    >({
      query: (params) => ({
        url: "/v1/discover/dashboard/upcoming",
        params,
      }),
      transformResponse: (response: ApiResponse<DashboardListResponse>) =>
        response.data,
      providesTags: ["Dashboard"],
    }),

    // Get on-demand/VOD tickets
    getOnDemandTickets: builder.query<
      DashboardListResponse,
      { page?: number; page_size?: number }
    >({
      query: (params) => ({
        url: "/v1/discover/dashboard/on-demand",
        params,
      }),
      transformResponse: (response: ApiResponse<DashboardListResponse>) =>
        response.data,
      providesTags: ["Dashboard"],
    }),

    // Get ticket by URL (URL should start with /)
    getTicketByUrl: builder.query<PublicTicketDetails, string>({
      query: (url) => {
        // Remove leading slash if present since the backend route adds it
        const cleanUrl = url.startsWith('/') ? url.slice(1) : url;
        return `/v1/discover/tickets/by-url/${cleanUrl}`;
      },
      transformResponse: (response: ApiResponse<PublicTicketDetails>) =>
        response.data,
      providesTags: (_result, _error, url) => [{ type: "Tickets", id: url }],
    }),

    // Get ticket by ID
    getTicketById: builder.query<PublicTicketDetails, number>({
      query: (id) => `/v1/discover/tickets/${id}`,
      transformResponse: (response: ApiResponse<PublicTicketDetails>) =>
        response.data,
      providesTags: (_result, _error, id) => [{ type: "Tickets", id }],
    }),

    // Get payment config for a ticket (Razorpay key)
    getTicketPaymentConfig: builder.query<{ razorpay_key_id: string }, number>({
      query: (ticketId) => `/v1/discover/tickets/${ticketId}/payment-config`,
      transformResponse: (response: ApiResponse<{ razorpay_key_id: string }>) =>
        response.data,
    }),
  }),
});

// My purchases response type
export interface MyPurchasesResponse {
  data: Array<{
    id: number;
    title: string;
    description?: string;
    thumbnail_image_portrait?: string;
    url?: string;
    start_datetime?: string;
    ticket_id: number;
    order_id: number;
    purchased_at: string;
  }>;
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export const viewerOrdersApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Get user's purchases
    getMyPurchases: builder.query<MyPurchasesResponse, { page?: number; page_size?: number }>({
      query: (params) => ({
        url: "/v1/viewer/orders/my-purchases",
        params,
      }),
      transformResponse: (response: ApiResponse<MyPurchasesResponse>) =>
        response.data,
      providesTags: ["Orders"],
    }),
  }),
});

export const {
  useGetDashboardQuery,
  useGetLiveTicketsQuery,
  useGetUpcomingTicketsQuery,
  useGetOnDemandTicketsQuery,
  useGetTicketByUrlQuery,
  useGetTicketByIdQuery,
  useGetTicketPaymentConfigQuery,
} = dashboardApi;

export const { useGetMyPurchasesQuery } = viewerOrdersApi;

