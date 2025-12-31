// Producer currency routes
import { Router, Response } from 'express';
import * as currencyService from '../../domains/currency/service.js';
import type {
  CreateCurrencyRequest,
  UpdateCurrencyRequest,
  CurrencyFilter,
  PaginationParams,
} from '../../domains/currency/types.js';
import { requireSession } from '../../domains/auth/session.js';
import { tenantMiddleware, getTenantContext } from '../../shared/middleware/tenant.js';
import { ok, okList, created, noContent, badRequest } from '../../shared/utils/response.js';
import type { AppRequest } from '../../shared/types/index.js';
import { asyncHandler } from '@/shared/index.js';

const router = Router();

// Apply middleware
router.use(requireSession);
router.use(tenantMiddleware);
// router.use(requireRole(ROLE_PRODUCER));

// List currencies
router.get('/', asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);

  const filter: CurrencyFilter = {
    code: req.query.code as string,
    search: req.query.search as string,
    is_active: req.query.is_active === 'true' ? true : req.query.is_active === 'false' ? false : undefined,
    is_default: req.query.is_default === 'true' ? true : req.query.is_default === 'false' ? false : undefined,
  };

  const pagination: PaginationParams = {
    page: parseInt(req.query.page as string, 10) || 1,
    page_size: parseInt(req.query.page_size as string, 10) || 20,
  };

  const result = await currencyService.listCurrencies(tenant.appId, tenant.tenantId, filter, pagination);
  okList(res, result);
}));

// Get default currency
router.get('/default', asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  const currency = await currencyService.getDefaultCurrency(tenant.appId, tenant.tenantId);
  ok(res, currency);
}));

// Get currency by ID
router.get('/:id', asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  const currencyId = parseInt(req.params.id, 10);

  if (isNaN(currencyId)) {
    return badRequest(res, 'Invalid currency ID');
  }

  const currency = await currencyService.getCurrency(tenant.appId, tenant.tenantId, currencyId);
  ok(res, currency);
}));

// Create currency
router.post('/', asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  const data: CreateCurrencyRequest = req.body;

  const currency = await currencyService.createCurrency(tenant.appId, tenant.tenantId, data);
  created(res, currency, 'Currency created successfully');
}));

// Update currency
router.put('/:id', asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  const currencyId = parseInt(req.params.id, 10);

  if (isNaN(currencyId)) {
    return badRequest(res, 'Invalid currency ID');
  }

  const data: UpdateCurrencyRequest = req.body;
  const currency = await currencyService.updateCurrency(tenant.appId, tenant.tenantId, currencyId, data);
  ok(res, currency, 'Currency updated successfully');
}));

// Delete currency
router.delete('/:id', asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  const currencyId = parseInt(req.params.id, 10);

  if (isNaN(currencyId)) {
    return badRequest(res, 'Invalid currency ID');
  }

  await currencyService.deleteCurrency(tenant.appId, tenant.tenantId, currencyId);
  noContent(res);
}));

// Set default currency
router.put('/:id/default', asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  const currencyId = parseInt(req.params.id, 10);

  if (isNaN(currencyId)) {
    return badRequest(res, 'Invalid currency ID');
  }

  await currencyService.setDefaultCurrency(tenant.appId, tenant.tenantId, currencyId);
  ok(res, null, 'Default currency set successfully');
}));

export const currencyRoutes: Router = router;

