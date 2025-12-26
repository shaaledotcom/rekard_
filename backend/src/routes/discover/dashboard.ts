// Public dashboard routes (no auth required)
import { Router, Response } from 'express';
import * as dashboardService from '../../domains/dashboard/service.js';
import type {
  DashboardPaginationParams,
  PaginationParams,
} from '../../domains/dashboard/types.js';
import { tenantMiddleware, } from '../../shared/middleware/tenant.js';
import { ok } from '../../shared/utils/response.js';
import type { AppRequest } from '../../shared/types/index.js';
import { asyncHandler } from '@/shared/index.js';

const router = Router();

// Apply tenant middleware (optional - for domain-based filtering)
router.use(tenantMiddleware);

// Get full dashboard (live, upcoming, on-demand)
router.get('/', asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = req.tenant;

  const pagination: DashboardPaginationParams = {
    live_page: parseInt(req.query.live_page as string, 10) || 1,
    live_page_size: parseInt(req.query.live_page_size as string, 10) || 10,
    upcoming_page: parseInt(req.query.upcoming_page as string, 10) || 1,
    upcoming_page_size: parseInt(req.query.upcoming_page_size as string, 10) || 10,
    on_demand_page: parseInt(req.query.on_demand_page as string, 10) || 1,
    on_demand_page_size: parseInt(req.query.on_demand_page_size as string, 10) || 10,
  };

  // Check if request is from a custom domain
  const fromDomain = req.headers['x-from-domain'] === 'true';

  let dashboard;
  if (fromDomain && tenant?.appId && tenant?.tenantId) {
    dashboard = await dashboardService.getDashboardByDomain(
      tenant.appId,
      tenant.tenantId,
      pagination
    );
  } else {
    dashboard = await dashboardService.getDashboard(pagination);
  }

  ok(res, dashboard);
}));

// Get live tickets
router.get('/live', asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = req.tenant;

  const pagination: PaginationParams = {
    page: parseInt(req.query.page as string, 10) || 1,
    page_size: parseInt(req.query.page_size as string, 10) || 10,
  };

  const fromDomain = req.headers['x-from-domain'] === 'true';

  const result = await dashboardService.getLiveTickets(
    pagination,
    fromDomain ? tenant?.appId : undefined,
    fromDomain ? tenant?.tenantId : undefined
  );

  ok(res, result);
}));

// Get upcoming tickets
router.get('/upcoming', asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = req.tenant;

  const pagination: PaginationParams = {
    page: parseInt(req.query.page as string, 10) || 1,
    page_size: parseInt(req.query.page_size as string, 10) || 10,
  };

  const fromDomain = req.headers['x-from-domain'] === 'true';

  const result = await dashboardService.getUpcomingTickets(
    pagination,
    fromDomain ? tenant?.appId : undefined,
    fromDomain ? tenant?.tenantId : undefined
  );

  ok(res, result);
}));

// Get on-demand/VOD tickets
router.get('/on-demand', asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = req.tenant;

  const pagination: PaginationParams = {
    page: parseInt(req.query.page as string, 10) || 1,
    page_size: parseInt(req.query.page_size as string, 10) || 10,
  };

  const fromDomain = req.headers['x-from-domain'] === 'true';

  const result = await dashboardService.getOnDemandTickets(
    pagination,
    fromDomain ? tenant?.appId : undefined,
    fromDomain ? tenant?.tenantId : undefined
  );

  ok(res, result);
}));

export const dashboardRoutes: Router = router;

