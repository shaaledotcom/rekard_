// Public platform settings route (no auth required)
import { Router, Response } from 'express';
import * as platformService from '../../domains/platform/service.js';
import * as tenantConfig from '../../domains/tenant/config.js';
import { tenantMiddleware } from '../../shared/middleware/tenant.js';
import { ok } from '../../shared/utils/response.js';
import type { AppRequest } from '../../shared/types/index.js';
import { asyncHandler } from '@/shared/index.js';

const router = Router();

// Apply tenant middleware for domain-based lookup
router.use(tenantMiddleware);

// Get public platform settings (legacy)
router.get('/', asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = req.tenant;
  
  // If from custom domain, get tenant-specific settings
  const fromDomain = req.headers['x-from-domain'] === 'true';

  if (fromDomain && tenant?.appId && tenant?.tenantId) {
    const settings = await platformService.getSettings(tenant.appId, tenant.tenantId);
    ok(res, settings);
  } else {
    // Return default/public settings
    const defaults = tenantConfig.getDefaultPlatformSettings();
    ok(res, {
      legal_name: defaults.legal_name,
      logo_url: defaults.logo_url,
      support_email: defaults.support_channels[0]?.value || 'support@rekard.com',
    });
  }
}));

/**
 * Get complete tenant configuration for viewer frontend
 * 
 * Query params:
 * - domain: The domain to resolve (optional, uses X-Host header if not provided)
 * - tenant_id: Explicit tenant ID (optional, for authenticated requests)
 * 
 * Returns combined platform settings, branding, and payment config
 */
router.get('/config', asyncHandler(async (req: AppRequest, res: Response) => {
  // Priority 1: Explicit tenant_id query param
  const tenantId = req.query.tenant_id as string;
  if (tenantId) {
    const config = await tenantConfig.getTenantConfigById(tenantId);
    ok(res, config);
    return;
  }
  
  // Priority 2: Domain from query param or headers
  const domain = (req.query.domain as string) || 
                 (req.headers['x-host'] as string) || 
                 req.headers.host || 
                 '';
  
  const config = await tenantConfig.getTenantConfigForDomain(domain);
  ok(res, config);
}));

export const publicPlatformRoutes: Router = router;
