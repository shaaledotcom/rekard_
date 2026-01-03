export { store } from "./store";
export type { RootState, AppDispatch } from "./store";
export { useAppDispatch, useAppSelector } from "./hooks";

// Re-export API
export {
  api,
  tagTypes,
  // User hooks
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
  // Billing hooks
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
  useGetSalesReportQuery,
  // Platform hooks
  useGetPlatformSettingsQuery,
  useUpdatePlatformSettingsMutation,
  // Payments hooks
  useCreateRazorpayOrderMutation,
  useVerifyRazorpayPaymentMutation,
} from "./api";

// Re-export types
export type {
  // User types
  UserResponse,
  PreferencesResponse,
  UpdatePreferencesRequest,
  HealthResponse,
  // Events types
  Event,
  EventStatus,
  EventListResponse,
  EventResponse,
  EventQueryParams,
  CreateEventRequest,
  UpdateEventRequest,
  // Tickets types
  Ticket,
  TicketStatus,
  TicketListResponse,
  TicketResponse,
  TicketQueryParams,
  CreateTicketRequest,
  UpdateTicketRequest,
  GeoblockingLocation,
  TicketEvent,
  TicketCoupon,
  TicketPricing,
  TicketSponsor,
  CouponFormRequest,
  PricingFormRequest,
  SponsorFormRequest,
  // Billing types
  BillingPlan,
  BillingPlanListResponse,
  BillingPlanResponse,
  BillingPlanQueryParams,
  PlanFeature,
  UserWallet,
  WalletResponse,
  WalletTransaction,
  WalletTransactionListResponse,
  WalletTransactionQueryParams,
  PricingTier,
  TicketPricingResponse,
  TicketPricingParams,
  PurchaseTicketsRequest,
  UserSubscription,
  SubscriptionResponse,
  PurchasePlanRequest,
  Invoice,
  InvoiceItem,
  InvoiceResponse,
  InvoiceListResponse,
  InvoiceQueryParams,
  PurchasePlanResponse,
  SalesReportEntry,
  SalesReportListResponse,
  SalesReportQueryParams,
  // Platform types
  PlatformSettings,
  PlatformSettingsResponse,
  UpdatePlatformSettingsRequest,
  FeaturedImage,
  FooterPolicy,
  FooterPolicies,
  SupportChannel,
  SupportChannelType,
  SocialLink,
  PlatformCouponCode,
  // Payments types
  RazorpayOrderRequest,
  RazorpayOrderResponse,
  RazorpayVerifyRequest,
  RazorpayVerifyResponse,
} from "./api";

export { setAuth, clearAuth, setLoading } from "./slices/authSlice";
