import { Response, NextFunction } from 'express';
import type { AppRequest, TenantContext, TenantResolvedFrom } from '../types/index.js';
import * as tenantService from '../../domains/tenant/service.js';
import { log } from './logger.js';

// System tenant UUID - used for unauthenticated/public requests
export const SYSTEM_TENANT_ID = '00000000-0000-0000-0000-000000000000';
export const DEFAULT_APP_ID = 'public';

// Extended request with userId from auth middleware
interface RequestWithAuth extends AppRequest {
  userId?: string;
}

/**
 * Extract tenant context from request
 * 
 * Resolution priority:
 * 1. Domain-based (for viewer pages) - via X-From-Domain header
 * 2. Header-based (for API calls) - via X-Tenant-Id header (UUID)
 * 3. Session-based (for producer panel) - auto-create/get tenant for user
 * 4. Default (unauthenticated) - empty tenant
 * 
 * For producers:
 * - tenantId = UUID from tenants table
 * - tenantUserId = producer's Supabase user ID
 * - appId = 'public' for free users, unique ID for Pro users
 */
export const extractTenantContext = async (req: AppRequest): Promise<TenantContext> => {
  const authReq = req as RequestWithAuth;
  const userId = authReq.userId || '';
  
  // Check if resolved from domain (viewer pages)
  const fromDomain = req.headers['x-from-domain'] === 'true';
  const domainTenantId = req.headers['x-domain-tenant-id'] as string;
  
  // Priority 1: Domain-based resolution (viewer pages)
  if (fromDomain && domainTenantId) {
    try {
      const context = await tenantService.getTenantContext(domainTenantId);
      return {
        userId,
        tenantId: context.tenantId,
        tenantUserId: context.userId,
        appId: context.appId,
        isPro: context.isPro,
        fromDomain: true,
        resolvedFrom: 'domain',
      };
    } catch (error) {
      log.warn(`Failed to resolve tenant from domain: ${domainTenantId}`, error);
    }
  }
  
  // Priority 2: Header-based (API calls with explicit tenant UUID)
  const headerTenantId = req.headers['x-tenant-id'] as string;
  if (headerTenantId && headerTenantId !== SYSTEM_TENANT_ID) {
    try {
      // Check if it's a UUID (tenant.id) or user ID
      const tenant = await tenantService.getTenantById(headerTenantId);
      if (tenant) {
        return {
          userId,
          tenantId: tenant.id,
          tenantUserId: tenant.user_id,
          appId: tenant.app_id,
          isPro: tenant.is_pro,
          fromDomain: false,
          resolvedFrom: 'header',
        };
      }
    } catch (error) {
      log.warn(`Failed to resolve tenant from header: ${headerTenantId}`, error);
    }
  }
  
  // Priority 3: Session-based (producer panel - auto-create tenant for user)
  if (userId) {
    try {
      // This will auto-create tenant if it doesn't exist
      const context = await tenantService.getTenantContext(userId);
      return {
        userId,
        tenantId: context.tenantId,
        tenantUserId: context.userId,
        appId: context.appId,
        isPro: context.isPro,
        fromDomain: false,
        resolvedFrom: 'session',
      };
    } catch (error) {
      log.warn(`Failed to resolve tenant from session: ${userId}`, error);
    }
  }
  
  // Priority 4: Default (unauthenticated or fallback) - use system tenant
  return {
    userId,
    tenantId: SYSTEM_TENANT_ID,
    tenantUserId: '',
    appId: DEFAULT_APP_ID,
    isPro: false,
    fromDomain: false,
    resolvedFrom: 'default',
  };
};

/**
 * Synchronous version for backwards compatibility
 * Uses cached/header values without async tenant lookup
 */
export const extractTenantContextSync = (req: AppRequest): TenantContext => {
  const authReq = req as RequestWithAuth;
  const userId = authReq.userId || '';
  const fromDomain = req.headers['x-from-domain'] === 'true';
  
  // Use header values directly (sync) - fall back to system tenant
  const appId = req.headers['x-app-id'] as string || DEFAULT_APP_ID;
  const tenantId = req.headers['x-tenant-id'] as string || SYSTEM_TENANT_ID;
  const tenantUserId = req.headers['x-tenant-user-id'] as string || userId;
  const isPro = req.headers['x-is-pro'] === 'true';
  
  let resolvedFrom: TenantResolvedFrom = 'default';
  if (fromDomain) resolvedFrom = 'domain';
  else if (req.headers['x-tenant-id']) resolvedFrom = 'header';
  else if (userId) resolvedFrom = 'session';
  
  return {
    userId,
    tenantId,
    tenantUserId,
    appId,
    isPro,
    fromDomain,
    resolvedFrom,
  };
};

/**
 * Async middleware to attach tenant context to request
 * Performs full tenant lookup with appId resolution
 * Auto-creates tenant for producers on first access
 */
export const tenantMiddleware = async (
  req: AppRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    req.tenant = await extractTenantContext(req);
    next();
  } catch (error) {
    log.error('Error in tenant middleware', error);
    // Fall back to sync extraction
    req.tenant = extractTenantContextSync(req);
    next();
  }
};

/**
 * Sync middleware for routes that don't need full tenant lookup
 */
export const tenantMiddlewareSync = (
  req: AppRequest,
  _res: Response,
  next: NextFunction
): void => {
  req.tenant = extractTenantContextSync(req);
  next();
};

// Get tenant context from request (throws if not available)
export const getTenantContext = (req: AppRequest): TenantContext => {
  if (!req.tenant) {
    throw new Error('Tenant context not initialized');
  }
  return req.tenant;
};

// Require authenticated user middleware
export const requireAuth = (
  req: AppRequest,
  res: Response,
  next: NextFunction
): void => {
  const tenant = req.tenant;

  if (!tenant?.userId) {
    res.status(401).json({
      success: false,
      error: 'User not authenticated',
    });
    return;
  }

  next();
};

