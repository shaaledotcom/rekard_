import { api } from "./baseApi";

// Types for orders
export interface CreateOrderRequest {
  ticket_id: number;
  quantity: number;
  unit_price: number;
  currency?: string;
}

export interface CreateUserAndOrderRequest {
  email: string;
  name?: string;
  phone?: string;
  ticket_id: number;
  quantity: number;
  unit_price: number;
  currency?: string;
}

export interface CreateUserAndOrderResponse {
  order_id: number;
  user_id: string;
}

export interface CompleteOrderRequest {
  order_id: number;
  payment_id: string;
  user_id?: string;
}

export interface PurchaseStatus {
  ticket_id: number;
  has_purchased: boolean;
  order_id?: number;
  order_number?: string;
  is_archived?: boolean;
  archive_date?: string;
}

export interface ValidateCouponRequest {
  coupon_code: string;
  ticket_id: number;
  order_amount: number;
}

export interface ValidateCouponResponse {
  is_valid: boolean;
  discount_type?: "percentage" | "fixed";
  discount_value?: number;
  discount_amount?: number;
  final_amount?: number;
  message?: string;
}

// Wrapper type for API responses
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const ordersApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Get purchase status for a ticket
    getPurchaseStatus: builder.query<PurchaseStatus, number>({
      query: (ticketId) => `/v1/viewer/orders/purchase-status/${ticketId}`,
      transformResponse: (response: ApiResponse<PurchaseStatus>) =>
        response.data,
      providesTags: (_result, _error, ticketId) => [
        { type: "Orders", id: `status-${ticketId}` },
      ],
    }),

    // Create order (for logged in users)
    createOrder: builder.mutation<
      { order_id: number },
      CreateOrderRequest
    >({
      query: (data) => ({
        url: "/v1/viewer/orders",
        method: "POST",
        body: data,
      }),
      transformResponse: (response: ApiResponse<{ id: number }>) => ({
        order_id: response.data.id,
      }),
      invalidatesTags: ["Orders"],
    }),

    // Create user and order (for purchase flow)
    createUserAndOrder: builder.mutation<
      CreateUserAndOrderResponse,
      CreateUserAndOrderRequest
    >({
      query: (data) => ({
        url: "/v1/viewer/orders/create",
        method: "POST",
        body: data,
      }),
      transformResponse: (response: ApiResponse<CreateUserAndOrderResponse>) =>
        response.data,
      invalidatesTags: ["Orders"],
    }),

    // Complete order after payment
    completeOrder: builder.mutation<
      { order_id: number; status: string },
      CompleteOrderRequest
    >({
      query: (data) => ({
        url: "/v1/viewer/orders/complete",
        method: "POST",
        body: data,
      }),
      transformResponse: (
        response: ApiResponse<{ order_id: number; status: string }>
      ) => response.data,
      invalidatesTags: ["Orders"],
    }),

    // Validate coupon
    validateCoupon: builder.mutation<
      ValidateCouponResponse,
      ValidateCouponRequest
    >({
      query: (data) => ({
        url: "/v1/viewer/orders/validate-coupon",
        method: "POST",
        body: data,
      }),
      transformResponse: (response: ApiResponse<ValidateCouponResponse>) =>
        response.data,
    }),

    // Get watch link for purchased ticket
    getWatchLink: builder.query<{ watch_link: string }, number>({
      query: (ticketId) => `/v1/viewer/orders/watch-link/${ticketId}`,
      transformResponse: (response: ApiResponse<{ watch_link: string }>) =>
        response.data,
    }),
  }),
});

export const {
  useGetPurchaseStatusQuery,
  useCreateOrderMutation,
  useCreateUserAndOrderMutation,
  useCompleteOrderMutation,
  useValidateCouponMutation,
  useGetWatchLinkQuery,
} = ordersApi;

