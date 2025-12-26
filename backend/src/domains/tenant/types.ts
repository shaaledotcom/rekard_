// Tenant domain types

/**
 * Source of how a viewer joined a tenant
 */
export type ViewerSource = 'purchase' | 'signup' | 'invite' | 'manual';

/**
 * Status of a viewer in a tenant
 */
export type ViewerStatus = 'active' | 'blocked' | 'inactive';

/**
 * Tenant status
 */
export type TenantStatus = 'active' | 'suspended' | 'deleted';

/**
 * Tenant record (producer's organization)
 */
export interface Tenant {
  id: string;              // UUID
  user_id: string;         // Producer's Supabase user ID
  app_id: string;          // 'public' for free, unique ID for Pro
  is_pro: boolean;
  pro_activated_at?: Date;
  primary_domain?: string;
  status: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Request to create a tenant
 */
export interface CreateTenantRequest {
  user_id: string;
  app_id?: string;
}

/**
 * Viewer-Tenant mapping record
 */
export interface ViewerTenantMapping {
  id: string;              // UUID
  viewer_user_id: string;
  tenant_id: string;       // UUID FK to tenants.id
  source: ViewerSource;
  first_order_id?: number;
  status: ViewerStatus;
  created_at: Date;
  updated_at: Date;
}

/**
 * Request to create a viewer-tenant mapping
 */
export interface CreateViewerMappingRequest {
  viewer_user_id: string;
  tenant_id: string;       // UUID of tenant
  source: ViewerSource;
  first_order_id?: number;
}

/**
 * Request to activate Pro for a tenant
 */
export interface ActivateProRequest {
  tenant_id: string;       // UUID of tenant
  custom_app_id?: string;  // Optional custom appId, defaults to tenant.id
}

/**
 * Result of cascade update
 */
export interface CascadeUpdateResult {
  success: boolean;
  old_app_id: string;
  new_app_id: string;
  tables_updated: {
    table_name: string;
    rows_affected: number;
  }[];
  total_rows_affected: number;
}

/**
 * Tenant context for API calls
 */
export interface TenantContextInfo {
  tenantId: string;        // UUID of tenant
  userId: string;          // Producer's Supabase user ID
  appId: string;           // Current appId
  isPro: boolean;
}

/**
 * Tables that need cascade update when appId changes
 * Note: With proper FK setup, some of these may not need app-level cascade
 */
export const TENANT_SCOPED_TABLES = [
  'events',
  'tickets',
  'orders',
  'carts',
  'billing_plans',
  'user_wallets',
  'wallet_transactions',
  'invoices',
  'user_subscriptions',
  'billing_audit_logs',
  'ticket_wallet_allocations',
  'email_access_grants',
  'ticket_buyers',
  'currencies',
  'platform_settings',
  'payment_gateway_settings',
  'domain_settings',
  'sms_gateway_settings',
  'email_gateway_settings',
  'payment_receiver_settings',
  'streaming_sessions',
  'chat_messages',
  'user_preferences',
] as const;

export type TenantScopedTable = typeof TENANT_SCOPED_TABLES[number];

