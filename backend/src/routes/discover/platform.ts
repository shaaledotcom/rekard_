// Public platform settings route (no auth required)
import { Router, Response } from 'express';
import * as platformService from '../../domains/platform/service.js';
import { tenantMiddleware } from '../../shared/middleware/tenant.js';
import { ok } from '../../shared/utils/response.js';
import type { AppRequest } from '../../shared/types/index.js';
import { asyncHandler } from '@/shared/index.js';

const router = Router();

// Apply tenant middleware for domain-based lookup
router.use(tenantMiddleware);

// Get public platform settings
router.get('/', asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = req.tenant;
  
  // If from custom domain, get tenant-specific settings
  const fromDomain = req.headers['x-from-domain'] === 'true';

  if (fromDomain && tenant?.appId && tenant?.tenantId) {
    const settings = await platformService.getSettings(tenant.appId, tenant.tenantId);
    ok(res, settings);
  } else {
    // Return default/public settings
    ok(res, {
      brand_name: 'Rekard',
      support_email: 'support@rekard.com',
    });
  }
}));

export const publicPlatformRoutes: Router = router;
