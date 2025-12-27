// Orders domain types

export type Order = {
  id: number;
  app_id: string;
  tenant_id: string;
  user_id: string;
  ticket_id: number;
  event_id?: number;
  order_number: string;
  status: OrderStatus;
  quantity: number;
  unit_price: number;
  total_amount: number;
  currency: string;
  payment_method?: string;
  external_payment_id?: string;
  customer_email?: string;
  customer_name?: string;
  customer_phone?: string;
  billing_address: Record<string, unknown>;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
};

export type OrderStatus = 'pending' | 'completed' | 'cancelled' | 'refunded';

export type CreateOrderRequest = {
  ticket_id: number;
  event_id?: number;
  quantity: number;
  unit_price: number;
  currency?: string;
  payment_method?: string;
  external_payment_id?: string;
  customer_email?: string;
  customer_name?: string;
  customer_phone?: string;
  billing_address?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

export type UpdateOrderRequest = {
  status?: OrderStatus;
  payment_method?: string;
  external_payment_id?: string;
  customer_email?: string;
  customer_name?: string;
  customer_phone?: string;
  billing_address?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

export type OrderFilter = {
  status?: OrderStatus;
  customer_email?: string;
  ticket_id?: number;
  event_id?: number;
  start_date?: Date;
  end_date?: Date;
};

export type OrderListResponse = {
  data: Order[];
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

// Order with related data
export type OrderWithDetails = Order & {
  ticket_title?: string;
  event_title?: string;
};

// Order statistics
export type OrderStats = {
  total_orders: number;
  total_revenue: number;
  average_order_value: number;
  orders_by_status: Record<OrderStatus, number>;
};

// Create user and order request (purchase without login)
export type CreateUserAndOrderRequest = {
  email: string;
  name?: string;
  phone?: string;
  ticket_id: number;
  event_id?: number;
  quantity: number;
  unit_price: number;
  currency?: string;
  payment_method?: string;
};

// Create user and order response
export type CreateUserAndOrderResponse = {
  user_id: string;
  order_id: number;
  order_number: string;
  email: string;
};

// Complete order request
export type CompleteOrderRequest = {
  order_id: number;
  payment_id: string;
  user_id?: string;
};

// Complete order response
export type CompleteOrderResponse = {
  order_id: number;
  payment_id: string;
  status: string;
};

// User purchase status response
export type UserPurchaseStatusResponse = {
  ticket_id: number;
  has_purchased: boolean;
  order_id?: number;
  order_number?: string;
};

// Watch link response
export type WatchLinkResponse = {
  ticket_id: number;
  watch_link: string;
  order_id: number;
};

// Purchase with ticket details (for my-purchases endpoint)
export type PurchaseWithTicketDetails = {
  id: number;
  title: string;
  description?: string;
  thumbnail_image_portrait?: string;
  url?: string;
  start_datetime?: string;
  ticket_id: number;
  order_id: number;
  purchased_at: Date;
};

export type MyPurchasesListResponse = {
  data: PurchaseWithTicketDetails[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

// Coupon validation request
export type ValidateCouponRequest = {
  coupon_code: string;
  ticket_id: number;
  order_amount: number;
};

// Coupon validation response
export type CouponValidationResponse = {
  is_valid: boolean;
  message: string;
  discount_amount: number;
  final_amount: number;
};

