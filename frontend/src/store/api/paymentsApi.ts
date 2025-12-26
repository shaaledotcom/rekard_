import { api } from "./baseApi";

// Razorpay types
export interface RazorpayOrderRequest {
  amount: number;
  currency: string;
  receipt: string;
  notes?: Record<string, unknown>;
}

export interface RazorpayOrderResponse {
  success: boolean;
  data: {
    id: string;
    entity: string;
    amount: number;
    amount_paid: number;
    amount_due: number;
    currency: string;
    receipt: string;
    status: string;
    created_at: number;
  };
  message?: string;
}

export interface RazorpayVerifyRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface RazorpayVerifyResponse {
  success: boolean;
  data: {
    verified: boolean;
  };
  message?: string;
}

// Payments API endpoints (Razorpay)
export const paymentsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createRazorpayOrder: builder.mutation<RazorpayOrderResponse, RazorpayOrderRequest>({
      query: (body) => ({
        url: "/v1/payments/razorpay/create-order",
        method: "POST",
        body,
      }),
    }),

    verifyRazorpayPayment: builder.mutation<RazorpayVerifyResponse, RazorpayVerifyRequest>({
      query: (body) => ({
        url: "/v1/payments/razorpay/verify",
        method: "POST",
        body,
      }),
    }),
  }),
});

// Export hooks
export const {
  useCreateRazorpayOrderMutation,
  useVerifyRazorpayPaymentMutation,
} = paymentsApi;

