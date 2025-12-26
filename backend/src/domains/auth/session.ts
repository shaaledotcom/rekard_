import { Response, NextFunction, Request } from 'express';
import { getSupabaseClient } from './supabase.js';
import type { AppRequest, TenantContext } from '../../shared/types/index.js';
import { log } from '../../shared/middleware/logger.js';
import { isLocalOrMainDomain, TENANT_PUBLIC } from './constants.js';
import type { DomainOwner, DomainOwnerProvider } from './types.js';
import { getUserMetadata } from './user.js';

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

// Resolve domain owner from host
const resolveDomainOwner = async (host: string): Promise<DomainOwner | null> => {
  if (!globalDomainOwnerProvider) return null;
  if (isLocalOrMainDomain(host)) return null;

  try {
    return await globalDomainOwnerProvider(host);
  } catch {
    return null;
  }
};

// Resolve tenant context from request
export const resolveTenantContext = async (
  req: AuthenticatedRequest
): Promise<TenantContext> => {
  // Get host from X-Host header or Host header
  const host = (req.headers['x-host'] as string) || req.headers.host || '';

  // Try domain-based resolution first
  const domainOwner = await resolveDomainOwner(host);
  if (domainOwner) {
    return {
      userId: domainOwner.userId,
      appId: domainOwner.appId,
      tenantId: domainOwner.tenantId,
      fromDomain: true,
    };
  }

  // Fall back to session-based resolution
  const userId = req.userId;
  if (!userId) {
    return {
      userId: '',
      appId: TENANT_PUBLIC,
      tenantId: TENANT_PUBLIC,
      fromDomain: false,
    };
  }

  const { appId, tenantId } = await getUserMetadata(userId);

  return {
    userId,
    appId,
    tenantId,
    fromDomain: false,
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
    next(error);
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
