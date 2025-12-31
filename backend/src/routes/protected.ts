import { Router, Response } from 'express';
import { ok, unauthorized } from '../shared/utils/response.js';
import { getUserMetadata, getUserRoles, getUserPermissions, getUserById, requireSession } from '../domains/auth/index.js';
import type { AuthenticatedRequest } from '../domains/auth/index.js';
import * as preferencesService from '../domains/preferences/service.js';
import { asyncHandler } from '../shared/index.js';
import { SYSTEM_TENANT_ID, DEFAULT_APP_ID } from '../domains/auth/constants.js';

const router = Router();

// All routes in this file require authentication
router.use(requireSession);

// Get current user info (supports both /me and /user for compatibility)
router.get('/me', asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.userId;
  if (!userId) {
    unauthorized(res);
    return;
  }

  const tenantId = req.tenant?.tenantId;
  const [user, metadata, roles, permissions] = await Promise.all([
    getUserById(userId),
    getUserMetadata(userId),
    getUserRoles(userId, tenantId),
    getUserPermissions(userId, tenantId),
  ]);

  // Return user data in format frontend expects
  ok(res, {
    id: userId,
    email: user?.emails?.[0] || '',
    phoneNumber: user?.phoneNumbers?.[0] || '',
    role: roles[0] || '',
    roles,
    permissions,
    app_id: metadata.appId,
    tenant_ids: [metadata.tenantId],
  }, 'User info retrieved successfully');
}));

// Get tenant context
router.get('/tenant', asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const tenant = req.tenant;
  if (!tenant) {
    unauthorized(res);
    return;
  }

  ok(res, tenant, 'Tenant context retrieved successfully');
}));

// Get user preferences
router.get('/preferences', asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.userId;
  if (!userId) {
    unauthorized(res);
    return;
  }

  const metadata = await getUserMetadata(userId);
  const appId = metadata.appId || DEFAULT_APP_ID;
  const tenantId = metadata.tenantId || SYSTEM_TENANT_ID;

  const preference = await preferencesService.getOrCreatePreference(appId, tenantId, userId);

  ok(res, {
    id: preference.id,
    user_id: preference.user_id,
    theme: preference.theme,
    language: preference.language,
    timezone: preference.timezone,
    notifications_enabled: preference.notifications_enabled,
    created_at: preference.created_at,
    updated_at: preference.updated_at,
  }, 'Preferences retrieved successfully');
}));

export const protectedRoutes: Router = router;

