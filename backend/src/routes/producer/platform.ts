// Producer platform settings routes
// Platform customization is a Pro plan feature
import { Router, Response } from 'express';
import * as platformService from '../../domains/platform/service.js';
import type {
  UpdatePlatformSettingsRequest,
} from '../../domains/platform/types.js';
import { requireSession } from '../../domains/auth/session.js';
import { tenantMiddleware, getTenantContext } from '../../shared/middleware/tenant.js';
import { requireProPlan } from '../../shared/middleware/plan.js';
import { ok } from '../../shared/utils/response.js';
import type { AppRequest } from '../../shared/types/index.js';
import { asyncHandler } from '@/shared/index.js';

const router = Router();

// Apply middleware
router.use(requireSession);
router.use(tenantMiddleware);

// Get platform settings (available to all users to view their settings)
router.get('/', asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  const settings = await platformService.getSettings(tenant.appId, tenant.tenantId);
  ok(res, settings);
}));

// Update platform settings (Pro Feature - requires Pro plan to customize platform)
router.put('/', requireProPlan('Platform Customization'), asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  const data: UpdatePlatformSettingsRequest = req.body;

  const settings = await platformService.updateSettings(tenant.appId, tenant.tenantId, data);
  ok(res, settings, 'Platform settings updated successfully');
}));

export const platformRoutes: Router = router;
