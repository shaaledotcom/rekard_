import { Request } from 'express';

// Plan tier types
export type PlanTier = 'free' | 'pro' | 'premium';

// Plan info attached by plan middleware
export interface PlanInfo {
  planTier: PlanTier;
  planName: string | null;
  isActive: boolean;
}

// How tenant context was resolved
export type TenantResolvedFrom = 'domain' | 'session' | 'header' | 'default';

// Tenant context attached to every request
export interface TenantContext {
  userId: string;             // Current user's Supabase ID
  tenantId: string;           // Tenant UUID (from tenants table)
  tenantUserId: string;       // Producer's Supabase user ID (tenant owner)
  appId: string;              // 'public' for free, unique ID for Pro
  isPro: boolean;             // Whether this tenant is on Pro plan
  fromDomain: boolean;        // Legacy: true if resolved from domain
  resolvedFrom: TenantResolvedFrom; // How the context was determined
}

// Extended request with tenant context and plan info
export interface AppRequest extends Request {
  tenant?: TenantContext;
  planInfo?: PlanInfo;
}

// Pagination parameters
export interface PaginationParams {
  page: number;
  pageSize: number;
}

// Sort parameters
export interface SortParams {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

// Paginated list response
export interface ListResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Standard API response
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// Health check response
export interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  service: string;
  version: string;
  timestamp: string;
}

// Filter with optional fields pattern
export type OptionalFilter<T> = {
  [K in keyof T]?: T[K] | null;
};

