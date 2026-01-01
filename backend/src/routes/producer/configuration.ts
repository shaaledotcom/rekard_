// Producer configuration routes (gateways)
// All configuration routes require Pro plan or higher
import { Router, Response } from 'express';
import * as configService from '../../domains/configuration/service.js';
import { requireSession } from '../../domains/auth/session.js';
import { tenantMiddleware, getTenantContext } from '../../shared/middleware/tenant.js';
import { requireProPlan } from '../../shared/middleware/plan.js';
import { ok, noContent } from '../../shared/utils/response.js';
import type { AppRequest } from '../../shared/types/index.js';
import { asyncHandler } from '../../shared/index.js';

const router = Router();

// Apply base middleware
router.use(requireSession);
router.use(tenantMiddleware);

// ===== Payment Gateway (Pro Feature) =====
router.get('/payment-gateway', requireProPlan('Payment Gateway'), asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  const settings = await configService.getPaymentGateway(tenant.appId, tenant.tenantId, tenant.userId);
  
  // Transform nested settings to flat format for frontend
  if (settings) {
    const flatSettings = {
      id: settings.id,
      key: (settings.settings as Record<string, unknown>)?.key || '',
      secret: (settings.settings as Record<string, unknown>)?.secret || '',
      is_active: settings.is_active,
      created_at: settings.created_at,
      updated_at: settings.updated_at,
    };
    ok(res, flatSettings);
  } else {
    ok(res, null);
  }
}));

router.post('/payment-gateway', requireProPlan('Payment Gateway'), asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  
  // Transform flat frontend format to nested backend format
  const backendData = {
    settings: {
      key: req.body.key || '',
      secret: req.body.secret || '',
    },
    is_active: req.body.is_active,
  };
  
  const settings = await configService.upsertPaymentGateway(tenant.appId, tenant.tenantId, tenant.userId, backendData);
  
  // Transform nested settings to flat format for frontend
  const flatSettings = {
    id: settings.id,
    key: (settings.settings as Record<string, unknown>)?.key || '',
    secret: (settings.settings as Record<string, unknown>)?.secret || '',
    is_active: settings.is_active,
    created_at: settings.created_at,
    updated_at: settings.updated_at,
  };
  
  ok(res, flatSettings, 'Payment gateway settings saved');
}));

router.put('/payment-gateway', requireProPlan('Payment Gateway'), asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  
  // Transform flat frontend format to nested backend format
  const backendData = {
    settings: {
      key: req.body.key || '',
      secret: req.body.secret || '',
    },
    is_active: req.body.is_active,
  };
  
  const settings = await configService.upsertPaymentGateway(tenant.appId, tenant.tenantId, tenant.userId, backendData);
  
  // Transform nested settings to flat format for frontend
  const flatSettings = {
    id: settings.id,
    key: (settings.settings as Record<string, unknown>)?.key || '',
    secret: (settings.settings as Record<string, unknown>)?.secret || '',
    is_active: settings.is_active,
    created_at: settings.created_at,
    updated_at: settings.updated_at,
  };
  
  ok(res, flatSettings, 'Payment gateway settings saved');
}));

router.delete('/payment-gateway', requireProPlan('Payment Gateway'), asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  await configService.deletePaymentGateway(tenant.appId, tenant.tenantId, tenant.userId);
  noContent(res);
}));

// ===== Domain Settings (Pro Feature) =====
router.get('/domain', requireProPlan('Custom Domain'), asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  const settings = await configService.getDomainByTenant(tenant.appId, tenant.tenantId);
  
  // Transform nested settings to flat format for frontend
  if (settings) {
    const flatSettings = {
      id: settings.id,
      domain: settings.domain,
      subdomain: (settings.settings as Record<string, unknown>)?.subdomain || settings.domain,
      is_active: settings.is_active,
      created_at: settings.created_at,
      updated_at: settings.updated_at,
    };
    ok(res, flatSettings);
  } else {
    ok(res, null);
  }
}));

router.post('/domain', requireProPlan('Custom Domain'), asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  
  // Transform flat frontend format to nested backend format
  const backendData = {
    domain: req.body.domain || '',
    settings: {
      subdomain: req.body.subdomain || req.body.domain || '',
    },
    is_active: req.body.is_active,
  };
  
  const settings = await configService.upsertDomain(tenant.appId, tenant.tenantId, tenant.userId, backendData);
  
  // Transform nested settings to flat format for frontend
  const flatSettings = {
    id: settings.id,
    domain: settings.domain,
    subdomain: (settings.settings as Record<string, unknown>)?.subdomain || settings.domain,
    is_active: settings.is_active,
    created_at: settings.created_at,
    updated_at: settings.updated_at,
  };
  
  ok(res, flatSettings, 'Domain settings saved');
}));

router.put('/domain', requireProPlan('Custom Domain'), asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  
  // Transform flat frontend format to nested backend format
  const backendData = {
    domain: req.body.domain || '',
    settings: {
      subdomain: req.body.subdomain || req.body.domain || '',
    },
    is_active: req.body.is_active,
  };
  
  const settings = await configService.upsertDomain(tenant.appId, tenant.tenantId, tenant.userId, backendData);
  
  // Transform nested settings to flat format for frontend
  const flatSettings = {
    id: settings.id,
    domain: settings.domain,
    subdomain: (settings.settings as Record<string, unknown>)?.subdomain || settings.domain,
    is_active: settings.is_active,
    created_at: settings.created_at,
    updated_at: settings.updated_at,
  };
  
  ok(res, flatSettings, 'Domain settings saved');
}));

router.delete('/domain', requireProPlan('Custom Domain'), asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  // Get the domain first, then delete it
  const domainSettings = await configService.getDomainByTenant(tenant.appId, tenant.tenantId);
  if (domainSettings) {
    await configService.deleteDomain(tenant.appId, tenant.tenantId, domainSettings.domain);
  }
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
  
  // Transform nested settings to flat format for frontend
  if (settings) {
    const s = settings.settings as Record<string, unknown>;
    const flatSettings = {
      id: settings.id,
      account_holder_name: s?.account_holder_name || '',
      account_number: s?.account_number || '',
      ifsc_code: s?.ifsc_code || '',
      pan: s?.pan || '',
      gstin: s?.gstin || '',
      upi_phone_number: s?.upi_phone_number || '',
      upi_id: s?.upi_id || '',
      is_active: settings.is_active,
      created_at: settings.created_at,
      updated_at: settings.updated_at,
    };
    ok(res, flatSettings);
  } else {
    ok(res, null);
  }
}));

router.post('/payment-receiver', requireProPlan('Payment Receiver'), asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  
  // Transform flat frontend format to nested backend format
  const backendData = {
    settings: {
      account_holder_name: req.body.account_holder_name || '',
      account_number: req.body.account_number || '',
      ifsc_code: req.body.ifsc_code || '',
      pan: req.body.pan || '',
      gstin: req.body.gstin || '',
      upi_phone_number: req.body.upi_phone_number || '',
      upi_id: req.body.upi_id || '',
    },
    is_active: req.body.is_active,
  };
  
  const settings = await configService.upsertPaymentReceiver(tenant.appId, tenant.tenantId, tenant.userId, backendData);
  
  // Transform nested settings to flat format for frontend
  const s = settings.settings as Record<string, unknown>;
  const flatSettings = {
    id: settings.id,
    account_holder_name: s?.account_holder_name || '',
    account_number: s?.account_number || '',
    ifsc_code: s?.ifsc_code || '',
    pan: s?.pan || '',
    gstin: s?.gstin || '',
    upi_phone_number: s?.upi_phone_number || '',
    upi_id: s?.upi_id || '',
    is_active: settings.is_active,
    created_at: settings.created_at,
    updated_at: settings.updated_at,
  };
  
  ok(res, flatSettings, 'Payment receiver settings saved');
}));

router.put('/payment-receiver', requireProPlan('Payment Receiver'), asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  
  // Transform flat frontend format to nested backend format
  const backendData = {
    settings: {
      account_holder_name: req.body.account_holder_name || '',
      account_number: req.body.account_number || '',
      ifsc_code: req.body.ifsc_code || '',
      pan: req.body.pan || '',
      gstin: req.body.gstin || '',
      upi_phone_number: req.body.upi_phone_number || '',
      upi_id: req.body.upi_id || '',
    },
    is_active: req.body.is_active,
  };
  
  const settings = await configService.upsertPaymentReceiver(tenant.appId, tenant.tenantId, tenant.userId, backendData);
  
  // Transform nested settings to flat format for frontend
  const s = settings.settings as Record<string, unknown>;
  const flatSettings = {
    id: settings.id,
    account_holder_name: s?.account_holder_name || '',
    account_number: s?.account_number || '',
    ifsc_code: s?.ifsc_code || '',
    pan: s?.pan || '',
    gstin: s?.gstin || '',
    upi_phone_number: s?.upi_phone_number || '',
    upi_id: s?.upi_id || '',
    is_active: settings.is_active,
    created_at: settings.created_at,
    updated_at: settings.updated_at,
  };
  
  ok(res, flatSettings, 'Payment receiver settings saved');
}));

router.delete('/payment-receiver', requireProPlan('Payment Receiver'), asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  await configService.deletePaymentReceiver(tenant.appId, tenant.tenantId, tenant.userId);
  noContent(res);
}));

export const configurationRoutes: Router = router;
