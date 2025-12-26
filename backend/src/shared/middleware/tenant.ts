import { Response, NextFunction } from 'express';
import type { AppRequest, TenantContext } from '../types/index.js';

const DEFAULT_APP_ID = 'public';
const DEFAULT_TENANT_ID = 'public';

// Extended request with userId from auth middleware
interface RequestWithAuth extends AppRequest {
  userId?: string;
}

// Extract tenant context from request
export const extractTenantContext = (req: AppRequest): TenantContext => {
  // Get user ID from session (will be set by auth middleware)
  const authReq = req as RequestWithAuth;
  const userId = authReq.userId || '';

  // Get app/tenant from session or headers
  const appId = req.headers['x-app-id'] as string || DEFAULT_APP_ID;
  const tenantId = req.headers['x-tenant-id'] as string || DEFAULT_TENANT_ID;

  // Check if resolved from domain
  const fromDomain = req.headers['x-from-domain'] === 'true';

  return {
    userId,
    appId,
    tenantId,
    fromDomain,
  };
};

// Middleware to attach tenant context to request
export const tenantMiddleware = (
  req: AppRequest,
  _res: Response,
  next: NextFunction
): void => {
  req.tenant = extractTenantContext(req);
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

