// Razorpay payment types

export type CreateOrderRequest = {
  amount: number;
  currency: string;
  receipt: string;
  notes?: Record<string, unknown>;
  customer_id?: string;
  callback_url?: string;
  callback_method?: string;
};

export type CreateOrderResponse = {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: string;
  notes: Record<string, unknown>;
  created_at: number;
};

export type PaymentVerificationRequest = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

export type PaymentCaptureRequest = {
  payment_id: string;
  amount: number;
  currency: string;
};

export type RefundRequest = {
  payment_id: string;
  amount: number;
  speed?: 'normal' | 'optimum';
  notes?: Record<string, unknown>;
};

export type WebhookEvent = {
  event: string;
  created_at: number;
  payload: Record<string, unknown>;
  account_id: string;
  contains: string[];
};

export type RazorpayPayment = {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  status: string;
  order_id: string;
  invoice_id?: string;
  international: boolean;
  method: string;
  amount_refunded: number;
  refund_status?: string;
  captured: boolean;
  description?: string;
  card_id?: string;
  bank?: string;
  wallet?: string;
  vpa?: string;
  email: string;
  contact: string;
  notes: Record<string, unknown>;
  fee?: number;
  tax?: number;
  error_code?: string;
  error_description?: string;
  error_source?: string;
  error_step?: string;
  error_reason?: string;
  acquirer_data?: Record<string, unknown>;
  created_at: number;
};

export type RazorpayRefund = {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  payment_id: string;
  notes: Record<string, unknown>;
  receipt?: string;
  acquirer_data?: Record<string, unknown>;
  created_at: number;
  batch_id?: string;
  status: string;
  speed_processed: string;
  speed_requested: string;
};

export type RazorpayConfig = {
  key_id: string;
  key_secret: string;
  webhook_secret: string;
};

export type PurchaseType = 'plan' | 'tickets' | 'event';

export type PaymentMetadata = {
  purchase_type: PurchaseType;
  app_id: string;
  tenant_id: string;
  user_id: string;
  [key: string]: unknown;
};

