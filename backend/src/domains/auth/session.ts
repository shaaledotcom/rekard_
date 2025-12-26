import { Response, NextFunction, Request } from 'express';
import { getSupabaseClient } from './supabase.js';
import type { AppRequest, TenantContext } from '../../shared/types/index.js';
import { log } from '../../shared/middleware/logger.js';
import { isLocalOrMainDomain } from './constants.js';
import type { DomainOwner, DomainOwnerProvider } from './types.js';
import * as tenantService from '../tenant/service.js';

// System tenant UUID - used for unauthenticated/public requests
const SYSTEM_TENANT_ID = '00000000-0000-0000-0000-000000000000';
const DEFAULT_APP_ID = 'public';

// Extended request with user info
export interface AuthenticatedRequest extends AppRequest {
  userId?: string;
  user?: {
    id: string;
    email?: string;
    phone?: string;
  };
}

// Global domain owner provider (set by configuration service)
let globalDomainOwnerProvider: DomainOwnerProvider | null = null;

export const setGlobalDomainOwnerProvider = (provider: DomainOwnerProvider): void => {
  globalDomainOwnerProvider = provider;
};

// Session verification middleware (optional session)
export const optionalSession = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const supabase = getSupabaseClient();
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (!error && user) {
        (req as AuthenticatedRequest).userId = user.id;
        (req as AuthenticatedRequest).user = {
          id: user.id,
          email: user.email,
          phone: user.phone,
        };
      }
    }
    next();
  } catch (error) {
    log.error('Error in optionalSession middleware', error);
    next();
  }
};

// Session verification middleware (required session)
export const requireSession = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized', message: 'Missing or invalid authorization header' });
      return;
    }

    const token = authHeader.substring(7);
    const supabase = getSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired token' });
      return;
    }

    (req as AuthenticatedRequest).userId = user.id;
    (req as AuthenticatedRequest).user = {
      id: user.id,
      email: user.email,
      phone: user.phone,
    };

    next();
  } catch (error) {
    log.error('Error in requireSession middleware', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get user ID from request
export const getUserIdFromSession = (req: AuthenticatedRequest): string | null => {
  return req.userId || null;
};

// Resolve domain owner from host (legacy provider)
const resolveDomainOwnerLegacy = async (host: string): Promise<DomainOwner | null> => {
  if (!globalDomainOwnerProvider) return null;
  if (isLocalOrMainDomain(host)) return null;

  try {
    return await globalDomainOwnerProvider(host);
  } catch {
    return null;
  }
};

// Resolve domain owner using new tenant service
const resolveDomainOwner = async (host: string): Promise<{ tenantId: string; appId: string } | null> => {
  if (isLocalOrMainDomain(host)) return null;
  
  try {
    // Try new tenant service first
    const result = await tenantService.resolveTenantFromDomain(host);
    if (result) {
      return result;
    }
    
    // Fall back to legacy provider
    const legacy = await resolveDomainOwnerLegacy(host);
    if (legacy) {
      return { tenantId: legacy.tenantId, appId: legacy.appId };
    }
    
    return null;
  } catch {
    return null;
  }
};

/**
 * Resolve tenant context from request
 * 
 * For producers: tenantId = UUID from tenants table (auto-created)
 * For viewers: tenantId = producer's tenant UUID (resolved from domain)
 */
export const resolveTenantContext = async (
  req: AuthenticatedRequest
): Promise<TenantContext> => {
  // Get host from X-Host header or Host header
  const host = (req.headers['x-host'] as string) || req.headers.host || '';

  // Try domain-based resolution first (for viewer pages)
  const domainOwner = await resolveDomainOwner(host);
  if (domainOwner) {
    const context = await tenantService.getTenantContext(domainOwner.tenantId);
    return {
      userId: req.userId || '',
      tenantId: context.tenantId,
      tenantUserId: context.userId,
      appId: context.appId,
      isPro: context.isPro,
      fromDomain: true,
      resolvedFrom: 'domain',
    };
  }

  // Fall back to session-based resolution
  // For producers: auto-create/get their tenant
  const userId = req.userId;
  if (!userId) {
    return {
      userId: '',
      tenantId: SYSTEM_TENANT_ID,
      tenantUserId: '',
      appId: DEFAULT_APP_ID,
      isPro: false,
      fromDomain: false,
      resolvedFrom: 'default',
    };
  }

  // Get or create tenant for this producer
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
};

// Middleware to resolve and attach tenant context
export const tenantContextMiddleware = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    req.tenant = await resolveTenantContext(req);
    next();
  } catch (error) {
    log.error('Error in tenantContextMiddleware', error);
    // Fallback to system tenant
    req.tenant = {
      userId: req.userId || '',
      tenantId: SYSTEM_TENANT_ID,
      tenantUserId: req.userId || '',
      appId: DEFAULT_APP_ID,
      isPro: false,
      fromDomain: false,
      resolvedFrom: 'default',
    };
    next();
  }
};

// Middleware to refresh roles (no-op for Supabase, roles are fetched from DB)
export const refreshRolesMiddleware = async (
  _req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  // No-op: roles are fetched from database on demand
  next();
};
