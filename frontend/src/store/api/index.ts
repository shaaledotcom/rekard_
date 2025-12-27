// Base API
export { api, tagTypes } from "./baseApi";

// User API
export {
  userApi,
  useGetMeQuery,
  useGetPreferencesQuery,
  useUpdatePreferencesMutation,
  useHealthCheckQuery,
} from "./userApi";
export type {
  UserResponse,
  PreferencesResponse,
  UpdatePreferencesRequest,
  HealthResponse,
} from "./userApi";

// Events API
export {
  eventsApi,
  useGetEventsQuery,
  useGetEventQuery,
  useCreateEventMutation,
  useUpdateEventMutation,
  useDeleteEventMutation,
  usePublishEventMutation,
  useCancelEventMutation,
  useCompleteEventMutation,
  useArchiveEventMutation,
  useSetEventDraftMutation,
} from "./eventsApi";
export type {
  Event,
  EventStatus,
  EventListResponse,
  EventResponse,
  EventQueryParams,
  CreateEventRequest,
  UpdateEventRequest,
} from "./eventsApi";

// Tickets API
export {
  ticketsApi,
  useGetTicketsQuery,
  useGetTicketQuery,
  useCreateTicketMutation,
  useUpdateTicketMutation,
  useDeleteTicketMutation,
  usePublishTicketMutation,
  useArchiveTicketMutation,
} from "./ticketsApi";
export type {
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
} from "./ticketsApi";

// Billing API
export {
  billingApi,
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
} from "./billingApi";
export type {
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
} from "./billingApi";

// Platform API
export {
  platformApi,
  useGetPlatformSettingsQuery,
  useUpdatePlatformSettingsMutation,
} from "./platformApi";
export type {
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
} from "./platformApi";

// Payments API (Razorpay)
export {
  paymentsApi,
  useCreateRazorpayOrderMutation,
  useVerifyRazorpayPaymentMutation,
} from "./paymentsApi";
export type {
  RazorpayOrderRequest,
  RazorpayOrderResponse,
  RazorpayVerifyRequest,
  RazorpayVerifyResponse,
} from "./paymentsApi";

// Configuration API (Pro Features)
export {
  configurationApi,
  useGetPaymentGatewaySettingsQuery,
  useCreatePaymentGatewaySettingsMutation,
  useUpdatePaymentGatewaySettingsMutation,
  useDeletePaymentGatewaySettingsMutation,
  useGetDomainSettingsQuery,
  useCreateDomainSettingsMutation,
  useUpdateDomainSettingsMutation,
  useDeleteDomainSettingsMutation,
  useGetPaymentReceiverSettingsQuery,
  useCreatePaymentReceiverSettingsMutation,
  useUpdatePaymentReceiverSettingsMutation,
  useDeletePaymentReceiverSettingsMutation,
} from "./configurationApi";
export type {
  PaymentGatewaySettings,
  DomainSettings,
  PaymentReceiverSettings,
  SmsGatewaySettings,
  EmailGatewaySettings,
} from "./configurationApi";

// Viewers API
export {
  viewersApi,
  useGetViewerAccessQuery,
  useGetViewerAccessByIdQuery,
  useGrantAccessMutation,
  useBulkImportAccessMutation,
  useValidateCSVMutation,
  useRevokeAccessMutation,
  useDeleteAccessMutation,
  useGetTicketAccessQuery,
  useGetViewersQuery,
  useGetAccessStatsQuery,
} from "./viewersApi";
export type {
  ViewerAccess,
  ViewerAccessStatus,
  ViewerAccessListResponse,
  ViewerMapping,
  ViewerMappingListResponse,
  ViewerAccessQueryParams,
  GrantAccessRequest,
  GrantAccessResult,
  BulkImportRequest,
  BulkImportResult,
  ValidateCSVResult,
  AccessStats,
} from "./viewersApi";

