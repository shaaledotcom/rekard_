import { api } from "./baseApi";

// Billing types
export interface PlanFeature {
  code: string;
  label: string;
  icon: string;
  description?: string;
}

export interface BillingPlan {
  id: number;
  app_id: string;
  tenant_id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  billing_cycle: string;
  initial_tickets: number;
  features: PlanFeature[];
  is_active: boolean;
  is_public: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface BillingPlanListResponse {
  success: boolean;
  data: BillingPlan[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface BillingPlanResponse {
  success: boolean;
  data: BillingPlan;
  message?: string;
}

export interface BillingPlanQueryParams {
  is_active?: boolean;
  is_public?: boolean;
  page?: number;
  page_size?: number;
}

export interface UserWallet {
  id: number;
  app_id: string;
  tenant_id: string;
  user_id: string;
  ticket_balance: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface WalletResponse {
  success: boolean;
  data: UserWallet;
  message?: string;
}

export interface WalletTransaction {
  id: number;
  app_id: string;
  tenant_id: string;
  user_id: string;
  transaction_type: string;
  amount: number;
  currency: string;
  balance_before: number;
  balance_after: number;
  reference_type?: string;
  reference_id?: string;
  description?: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface WalletTransactionListResponse {
  success: boolean;
  data: WalletTransaction[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface WalletTransactionQueryParams {
  type?: string;
  page?: number;
  page_size?: number;
}

export interface PricingTier {
  min_quantity: number;
  max_quantity: number;
  unit_price: number;
}

export interface TicketPricingResponse {
  success: boolean;
  data: {
    quantity: number;
    unit_price: number;
    total_price: number;
    currency: string;
    pricing_tiers: PricingTier[];
  };
}

export interface TicketPricingParams {
  quantity: number;
  currency?: string;
}

export interface PurchaseTicketsRequest {
  quantity: number;
  currency?: string;
  payment_method_id?: string;
  external_payment_id?: string;
  billing_address?: Record<string, unknown>;
}

export interface UserSubscription {
  id: number;
  app_id: string;
  tenant_id: string;
  user_id: string;
  plan_id: number;
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  cancelled_at?: string;
  trial_start?: string;
  trial_end?: string;
  payment_method_id?: string;
  external_subscription_id?: string;
  created_at: string;
  updated_at: string;
  plan?: BillingPlan;
}

export interface SubscriptionResponse {
  success: boolean;
  data: UserSubscription | null;
  message?: string;
}

export interface PurchasePlanRequest {
  plan_id: number;
  payment_method_id?: string;
  external_payment_id?: string;
  billing_address?: Record<string, unknown>;
}

export interface Invoice {
  id: number;
  app_id: string;
  tenant_id: string;
  user_id: string;
  invoice_number: string;
  status: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  tax_rate: number;
  due_date?: string;
  paid_at?: string;
  payment_method?: string;
  external_payment_id?: string;
  billing_address: Record<string, unknown>;
  items: InvoiceItem[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id?: number;
  invoice_id?: number;
  item_type: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  currency: string;
  metadata: Record<string, unknown>;
  created_at?: string;
}

export interface InvoiceResponse {
  success: boolean;
  data: Invoice;
  message?: string;
}

export interface InvoiceListResponse {
  success: boolean;
  data: Invoice[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface InvoiceQueryParams {
  status?: string;
  page?: number;
  page_size?: number;
}

export interface PurchasePlanResponse {
  success: boolean;
  data: {
    subscription: UserSubscription;
    invoice: Invoice;
  };
  message?: string;
}

// Billing API endpoints
export const billingApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Billing - Plans
    getBillingPlans: builder.query<BillingPlanListResponse, BillingPlanQueryParams | void>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.is_active !== undefined) searchParams.append("is_active", String(params.is_active));
        if (params?.is_public !== undefined) searchParams.append("is_public", String(params.is_public));
        if (params?.page) searchParams.append("page", params.page.toString());
        if (params?.page_size) searchParams.append("page_size", params.page_size.toString());
        const queryString = searchParams.toString();
        return `/v1/producer/billing/plans${queryString ? `?${queryString}` : ""}`;
      },
      providesTags: ["Billing"],
    }),

    getPlanById: builder.query<BillingPlanResponse, number>({
      query: (id) => `/v1/producer/billing/plans/${id}`,
      providesTags: ["Billing"],
    }),

    // Billing - Wallet
    getUserWallet: builder.query<WalletResponse, void>({
      query: () => "/v1/producer/billing/wallet",
      providesTags: ["Billing"],
    }),

    getWalletTransactions: builder.query<WalletTransactionListResponse, WalletTransactionQueryParams | void>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.type) searchParams.append("type", params.type);
        if (params?.page) searchParams.append("page", params.page.toString());
        if (params?.page_size) searchParams.append("page_size", params.page_size.toString());
        const queryString = searchParams.toString();
        return `/v1/producer/billing/wallet/transactions${queryString ? `?${queryString}` : ""}`;
      },
      providesTags: ["Billing"],
    }),

    getTicketPricing: builder.query<TicketPricingResponse, TicketPricingParams>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        searchParams.append("quantity", params.quantity.toString());
        if (params.currency) searchParams.append("currency", params.currency);
        return `/v1/producer/billing/wallet/ticket-pricing?${searchParams.toString()}`;
      },
    }),

    purchaseTickets: builder.mutation<InvoiceResponse, PurchaseTicketsRequest>({
      query: (body) => ({
        url: "/v1/producer/billing/wallet/purchase-tickets",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Billing"],
    }),

    // Billing - Subscriptions
    getUserSubscription: builder.query<SubscriptionResponse, void>({
      query: () => "/v1/producer/billing/subscriptions/active",
      providesTags: ["Billing"],
    }),

    purchasePlan: builder.mutation<PurchasePlanResponse, { planId: number; body: PurchasePlanRequest }>({
      query: ({ planId, body }) => ({
        url: `/v1/producer/billing/plans/${planId}/purchase`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Billing"],
    }),

    cancelSubscription: builder.mutation<{ cancelled: boolean }, { immediate?: boolean }>({
      query: (body) => ({
        url: "/v1/producer/billing/subscription/cancel",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Billing"],
    }),

    // Billing - Invoices
    getInvoices: builder.query<InvoiceListResponse, InvoiceQueryParams | void>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.status) searchParams.append("status", params.status);
        if (params?.page) searchParams.append("page", params.page.toString());
        if (params?.page_size) searchParams.append("page_size", params.page_size.toString());
        const queryString = searchParams.toString();
        return `/v1/producer/billing/invoices${queryString ? `?${queryString}` : ""}`;
      },
      providesTags: ["Billing"],
    }),
  }),
});

// Export hooks
export const {
  useGetBillingPlansQuery,
  useGetPlanByIdQuery,
  useGetUserWalletQuery,
  useGetWalletTransactionsQuery,
  useGetTicketPricingQuery,
  usePurchaseTicketsMutation,
  useGetUserSubscriptionQuery,
  usePurchasePlanMutation,
  useCancelSubscriptionMutation,
  useGetInvoicesQuery,
} = billingApi;

