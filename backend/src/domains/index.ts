// Domain exports - use namespace imports to avoid conflicts
export * from './auth/index.js';
export * from './billing/index.js';
export * from './payments/index.js';
export * from './platform/index.js';
export * from './configuration/index.js';
export * from './users/index.js';

// Producer domains - re-export as namespaces to avoid type conflicts
export { eventsRepo, eventsService } from './events/index.js';
export type { Event, CreateEventRequest, UpdateEventRequest, EventFilter, EventListResponse, EventStatus, RelatedEvent } from './events/types.js';

export { ticketsRepo, ticketsService } from './tickets/index.js';
export type { Ticket, TicketCoupon, TicketPricing, TicketSponsor, TicketEvent, CreateTicketRequest, UpdateTicketRequest, TicketFilter, TicketListResponse, TicketStatus, ValidateCouponResult } from './tickets/types.js';

export { ordersRepo, ordersService } from './orders/index.js';
export type { Order, CreateOrderRequest as CreateOrderPurchaseRequest, UpdateOrderRequest, OrderFilter, OrderListResponse, OrderStatus, OrderWithDetails, OrderStats } from './orders/types.js';

// Viewer domains
export { cartRepo, cartService } from './cart/index.js';
export type { Cart, CartItem, CartCoupon, CartSummary, CartWithSummary, AddToCartRequest, UpdateCartItemRequest } from './cart/types.js';

export { streamingRepo, streamingService } from './streaming/index.js';
export type { StreamingSession, CreateStreamingSessionRequest, UpdateStreamingSessionRequest, StreamingSessionFilter, StreamingSessionListResponse, ValidateSessionResult, CreateSessionResponse } from './streaming/types.js';

// Dashboard/Public domains
export { dashboardRepo, dashboardService } from './dashboard/index.js';
export type { DashboardTicket, DashboardResponse, DashboardPaginationParams, PublicTicketDetails, PublicEventDetails } from './dashboard/types.js';

// Currency domain
export { currencyRepo, currencyService } from './currency/index.js';
export type { Currency, CreateCurrencyRequest, UpdateCurrencyRequest, CurrencyFilter, CurrencyListResponse } from './currency/types.js';

// Chat domain
export { chatRepo, chatService, chatWebSocket } from './chat/index.js';
export type { Message, CreateMessageRequest, UpdateMessageRequest, MessagesResponse, WsMessage } from './chat/types.js';

// Uploads domain
export { uploadsService } from './uploads/index.js';
export type { UploadedFile, PresignedUrlRequest, PresignedUrlResponse, UploadResult, UploadCategory } from './uploads/types.js';

// Tenant domain
export * as tenantService from './tenant/service.js';
export type {
  Tenant,
  ViewerTenantMapping,
  CreateTenantRequest,
  CreateViewerMappingRequest,
  ActivateProRequest,
  CascadeUpdateResult,
  TenantContextInfo,
  ViewerSource,
  ViewerStatus,
  TenantScopedTable,
} from './tenant/types.js';

// Viewers domain
export { viewersRepository, viewersService } from './viewers/index.js';
export type {
  ViewerAccess,
  ViewerAccessStatus,
  ViewerAccessListResponse,
  ViewerAccessFilter,
  ViewerMapping,
  Viewer,
  ViewerListResponse,
  GrantAccessRequest,
  GrantAccessResult,
  BulkGrantAccessRequest,
  RevokeAccessRequest,
  UpdateAccessRequest,
  ViewerFilter,
  CSVParseResult,
  ParsedCSVRow,
} from './viewers/types.js';

