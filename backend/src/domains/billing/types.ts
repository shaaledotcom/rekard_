// Billing domain types

export type BillingPlan = {
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
  created_at: Date;
  updated_at: Date;
};

export type PlanFeature = {
  code: string;
  label: string;
  icon: string;
  description?: string;
};

export type UserWallet = {
  id: number;
  app_id: string;
  tenant_id: string;
  user_id: string;
  ticket_balance: number;
  currency: string;
  created_at: Date;
  updated_at: Date;
};

export type WalletTransaction = {
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
  created_at: Date;
  user_email?: string;
};

export type Invoice = {
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
  due_date?: Date;
  paid_at?: Date;
  payment_method?: string;
  external_payment_id?: string;
  billing_address: Record<string, unknown>;
  items: InvoiceItem[];
  notes?: string;
  created_at: Date;
  updated_at: Date;
};

export type InvoiceItem = {
  id?: number;
  invoice_id?: number;
  item_type: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  currency: string;
  metadata: Record<string, unknown>;
  created_at?: Date;
};

export type UserSubscription = {
  id: number;
  app_id: string;
  tenant_id: string;
  user_id: string;
  plan_id: number;
  status: string;
  current_period_start: Date;
  current_period_end: Date;
  cancel_at_period_end: boolean;
  cancelled_at?: Date;
  trial_start?: Date;
  trial_end?: Date;
  payment_method_id?: string;
  external_subscription_id?: string;
  created_at: Date;
  updated_at: Date;
  plan?: BillingPlan;
};

export type BillingAuditLog = {
  id: number;
  app_id: string;
  tenant_id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  old_value: Record<string, unknown>;
  new_value: Record<string, unknown>;
  performed_by: string;
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
};

// Request types
export type CreateBillingPlanRequest = {
  name: string;
  description?: string;
  price: number;
  currency?: string;
  billing_cycle?: string;
  initial_tickets: number;
  features?: PlanFeature[];
  is_active?: boolean;
  is_public?: boolean;
  sort_order?: number;
};

export type UpdateBillingPlanRequest = {
  name?: string;
  description?: string;
  price?: number;
  currency?: string;
  billing_cycle?: string;
  initial_tickets?: number;
  features?: PlanFeature[];
  is_active?: boolean;
  is_public?: boolean;
  sort_order?: number;
};

export type PurchasePlanRequest = {
  plan_id: number;
  payment_method_id?: string;
  external_payment_id?: string;
  billing_address?: Record<string, unknown>;
  apply_trial?: boolean;
};

export type PurchaseTicketsRequest = {
  quantity: number;
  unit_price?: number;
  currency?: string;
  payment_method_id?: string;
  external_payment_id?: string;
  billing_address?: Record<string, unknown>;
};

export type ConsumeTicketsRequest = {
  quantity: number;
  reference_type: string;
  reference_id: string;
  description?: string;
  metadata?: Record<string, unknown>;
};

// Filter types
export type BillingPlanFilter = {
  app_id?: string;
  tenant_id?: string;
  is_active?: boolean;
  is_public?: boolean;
  search?: string;
};

export type WalletTransactionFilter = {
  app_id?: string;
  tenant_id?: string;
  user_id?: string;
  transaction_type?: string;
  start_date?: Date;
  end_date?: Date;
};

export type InvoiceFilter = {
  app_id?: string;
  tenant_id?: string;
  user_id?: string;
  status?: string;
  start_date?: Date;
  end_date?: Date;
};

export type PaginationParams = {
  page?: number;
  page_size?: number;
};

export type SortParams = {
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
};

export type ListResponse<T> = {
  data: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

// Ticket Wallet Allocation
export type TicketWalletAllocation = {
  id: number;
  app_id: string;
  tenant_id: string;
  user_id: string;
  ticket_id: number;
  allocated_quantity: number;
  consumed_quantity: number;
  available_quantity: number;
  status: 'active' | 'released' | 'consumed';
  created_at: Date;
  updated_at: Date;
};

export type AllocationFilter = {
  user_id?: string;
  ticket_id?: number;
  status?: string;
};

// Email Access Grant
export type EmailAccessGrant = {
  id: number;
  app_id: string;
  tenant_id: string;
  producer_user_id: string;
  email: string;
  ticket_id: number;
  event_id?: number;
  quantity: number;
  status: 'pending' | 'granted' | 'revoked';
  granted_at?: Date;
  revoked_at?: Date;
  created_at: Date;
  updated_at: Date;
};

export type BulkEmailAccessRequest = {
  user_emails: string[];
  ticket_id: number;
  event_id?: number;
  quantity: number;
  unit_price?: number;
  currency?: string;
};

export type EmailAccessResult = {
  email: string;
  status: 'granted' | 'failed' | 'already_exists';
  ticket_id: number;
  quantity: number;
  error?: string;
};

// Ticket Buyer
export type TicketBuyer = {
  user_id: string;
  email: string;
  name?: string;
  phone?: string;
  ticket_id: number;
  ticket_title: string;
  quantity: number;
  total_amount: number;
  currency: string;
  purchased_at: Date;
  order_number: string;
};

// Sales Report
export type SalesReportEntry = {
  id: string; // "order-{id}" or "grant-{id}"
  type: 'purchased' | 'granted';
  date: Date;
  user_email: string;
  ticket_id: number;
  ticket_title: string;
  quantity: number;
  amount?: number; // Only for purchased orders
  currency: string;
  order_number?: string; // Only for purchased orders
};

export type SalesReportFilter = {
  type?: 'purchased' | 'granted' | 'all';
  ticket_id?: number;
  user_email?: string;
  start_date?: Date;
  end_date?: Date;
};

