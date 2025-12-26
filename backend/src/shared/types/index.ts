import { Request } from 'express';

// Tenant context attached to every request
export interface TenantContext {
  userId: string;
  appId: string;
  tenantId: string;
  fromDomain: boolean;
}

// Extended request with tenant context
export interface AppRequest extends Request {
  tenant?: TenantContext;
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

