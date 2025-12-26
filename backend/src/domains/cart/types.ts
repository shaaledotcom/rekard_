// Cart domain types

export type Cart = {
  id: number;
  app_id: string;
  tenant_id: string;
  user_id: string;
  status: CartStatus;
  expires_at?: Date;
  created_at: Date;
  updated_at: Date;
  items?: CartItem[];
  coupons?: CartCoupon[];
};

export type CartStatus = 'active' | 'checked_out' | 'expired' | 'abandoned';

export type CartItem = {
  id: number;
  cart_id: number;
  ticket_id: number;
  quantity: number;
  unit_price: number;
  currency: string;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
  ticket?: TicketInfo;
};

export type TicketInfo = {
  id: number;
  title: string;
  description?: string;
  thumbnail_image_portrait?: string;
  featured_image?: string;
  url?: string;
  status: string;
};

export type CartCoupon = {
  id: number;
  cart_id: number;
  coupon_code: string;
  discount_amount: number;
  discount_type: string;
  applied_at: Date;
};

export type CartSummary = {
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total: number;
  item_count: number;
  currency: string;
};

// Request types
export type AddToCartRequest = {
  ticket_id: number;
  quantity: number;
  unit_price: number;
  currency?: string;
};

export type UpdateCartItemRequest = {
  quantity: number;
  unit_price?: number;
};

export type ApplyCouponRequest = {
  coupon_code: string;
};

// Cart with summary
export type CartWithSummary = Cart & {
  summary: CartSummary;
};

