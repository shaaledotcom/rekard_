import { Router, Response } from 'express';
import { healthRoutes } from './health.js';
import { protectedRoutes } from './protected.js';
import { producerRoutes } from './producer/index.js';
import { viewerRoutes } from './viewer/index.js';
import { discoverRoutes } from './discover/index.js';
import { paymentsRoutes } from './payments/index.js';
import { uploadsRoutes } from './uploads/index.js';
import { ok, unauthorized } from '../shared/utils/response.js';
import { getUserMetadata, requireSession } from '../domains/auth/index.js';
import type { AuthenticatedRequest } from '../domains/auth/index.js';
import * as preferencesService from '../domains/preferences/service.js';
import { asyncHandler } from '../shared/index.js';
import { SYSTEM_TENANT_ID, DEFAULT_APP_ID } from '../domains/auth/constants.js';

const router = Router();

// Health and readiness routes (no auth required)
router.use(healthRoutes);

// Discover routes (no auth required - dashboard, ticket discovery)
router.use('/v1/discover', discoverRoutes);

// Payment routes (webhooks + authenticated)
router.use('/v1/payments', paymentsRoutes);

// Protected routes (require authentication)
router.use('/v1/protected', protectedRoutes);

// Producer API routes
router.use('/v1/producer', producerRoutes);

// Viewer API routes
router.use('/v1/viewer', viewerRoutes);

// Upload API routes
router.use('/v1/uploads', uploadsRoutes);

// Preferences route (for frontend compatibility - expects /preferences not /protected/preferences)
router.put('/v1/preferences', requireSession, asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.userId;
  if (!userId) {
    unauthorized(res);
    return;
  }

  const metadata = await getUserMetadata(userId);
  const appId = metadata.appId || DEFAULT_APP_ID;
  const tenantId = metadata.tenantId || SYSTEM_TENANT_ID;

  const { theme, language, timezone, notifications_enabled } = req.body;

  const preference = await preferencesService.updatePreference(appId, tenantId, userId, {
    theme,
    language,
    timezone,
    notifications_enabled,
  });

  ok(res, {
    id: preference.id,
    user_id: preference.user_id,
    theme: preference.theme,
    language: preference.language,
    timezone: preference.timezone,
    notifications_enabled: preference.notifications_enabled,
    created_at: preference.created_at,
    updated_at: preference.updated_at,
  }, 'Preferences updated successfully');
}));

export const routes: Router = router;

