// Producer configuration routes (gateways)
// All configuration routes require Pro plan or higher
import { Router, Response } from 'express';
import * as configService from '../../domains/configuration/service.js';
import { requireSession } from '../../domains/auth/session.js';
import { tenantMiddleware, getTenantContext } from '../../shared/middleware/tenant.js';
import { requireProPlan } from '../../shared/middleware/plan.js';
import { ok, noContent } from '../../shared/utils/response.js';
import type { AppRequest } from '../../shared/types/index.js';
import { asyncHandler } from '@/shared/index.js';

const router = Router();

// Apply base middleware
router.use(requireSession);
router.use(tenantMiddleware);

// ===== Payment Gateway (Pro Feature) =====
router.get('/payment-gateway', requireProPlan('Payment Gateway'), asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  const settings = await configService.getPaymentGateway(tenant.appId, tenant.tenantId, tenant.userId);
  ok(res, settings);
}));

router.put('/payment-gateway', requireProPlan('Payment Gateway'), asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  const settings = await configService.upsertPaymentGateway(tenant.appId, tenant.tenantId, tenant.userId, req.body);
  ok(res, settings, 'Payment gateway settings saved');
}));

router.delete('/payment-gateway', requireProPlan('Payment Gateway'), asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  await configService.deletePaymentGateway(tenant.appId, tenant.tenantId, tenant.userId);
  noContent(res);
}));

// ===== Domain Settings (Pro Feature) =====
router.get('/domain', requireProPlan('Custom Domain'), asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  const settings = await configService.getDomain(tenant.appId, tenant.tenantId, tenant.userId);
  ok(res, settings);
}));

router.put('/domain', requireProPlan('Custom Domain'), asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  const settings = await configService.upsertDomain(tenant.appId, tenant.tenantId, tenant.userId, req.body);
  ok(res, settings, 'Domain settings saved');
}));

router.delete('/domain', requireProPlan('Custom Domain'), asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  await configService.deleteDomain(tenant.appId, tenant.tenantId, tenant.userId);
  noContent(res);
}));

// ===== SMS Gateway (Pro Feature) =====
router.get('/sms-gateway', requireProPlan('SMS Gateway'), asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  const settings = await configService.getSmsGateway(tenant.appId, tenant.tenantId, tenant.userId);
  ok(res, settings);
}));

router.put('/sms-gateway', requireProPlan('SMS Gateway'), asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  const settings = await configService.upsertSmsGateway(tenant.appId, tenant.tenantId, tenant.userId, req.body);
  ok(res, settings, 'SMS gateway settings saved');
}));

router.delete('/sms-gateway', requireProPlan('SMS Gateway'), asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  await configService.deleteSmsGateway(tenant.appId, tenant.tenantId, tenant.userId);
  noContent(res);
}));

// ===== Email Gateway (Pro Feature) =====
router.get('/email-gateway', requireProPlan('Email Gateway'), asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  const settings = await configService.getEmailGateway(tenant.appId, tenant.tenantId, tenant.userId);
  ok(res, settings);
}));

router.put('/email-gateway', requireProPlan('Email Gateway'), asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  const settings = await configService.upsertEmailGateway(tenant.appId, tenant.tenantId, tenant.userId, req.body);
  ok(res, settings, 'Email gateway settings saved');
}));

router.delete('/email-gateway', requireProPlan('Email Gateway'), asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  await configService.deleteEmailGateway(tenant.appId, tenant.tenantId, tenant.userId);
  noContent(res);
}));

// ===== Payment Receiver (Pro Feature) =====
router.get('/payment-receiver', requireProPlan('Payment Receiver'), asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  const settings = await configService.getPaymentReceiver(tenant.appId, tenant.tenantId, tenant.userId);
  ok(res, settings);
}));

router.put('/payment-receiver', requireProPlan('Payment Receiver'), asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  const settings = await configService.upsertPaymentReceiver(tenant.appId, tenant.tenantId, tenant.userId, req.body);
  ok(res, settings, 'Payment receiver settings saved');
}));

router.delete('/payment-receiver', requireProPlan('Payment Receiver'), asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  await configService.deletePaymentReceiver(tenant.appId, tenant.tenantId, tenant.userId);
  noContent(res);
}));

export const configurationRoutes: Router = router;
