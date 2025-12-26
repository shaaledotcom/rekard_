// Configuration repository using Drizzle ORM
import { eq, and } from 'drizzle-orm';
import { db, paymentGatewaySettings, domainSettings, smsGatewaySettings, emailGatewaySettings, paymentReceiverSettings } from '../../db/index';
import type {
  PaymentGatewaySettings,
  DomainSettings,
  SmsGatewaySettings,
  EmailGatewaySettings,
  PaymentReceiverSettings,
  CreatePaymentGatewayRequest,
  UpdatePaymentGatewayRequest,
  CreateDomainRequest,
  UpdateDomainRequest,
  CreateSmsGatewayRequest,
  UpdateSmsGatewayRequest,
  CreateEmailGatewayRequest,
  UpdateEmailGatewayRequest,
  CreatePaymentReceiverRequest,
  UpdatePaymentReceiverRequest,
} from './types';

// Transform functions
const transformPaymentGateway = (row: typeof paymentGatewaySettings.$inferSelect): PaymentGatewaySettings => ({
  id: row.id,
  app_id: row.appId,
  tenant_id: row.tenantId,
  gateway_type: row.gatewayType,
  settings: (row.settings as Record<string, unknown>) || {},
  is_active: row.isActive,
  created_at: row.createdAt,
  updated_at: row.updatedAt,
});

const transformDomain = (row: typeof domainSettings.$inferSelect): DomainSettings => ({
  id: row.id,
  app_id: row.appId,
  tenant_id: row.tenantId,
  domain: row.domain,
  settings: (row.settings as Record<string, unknown>) || {},
  is_active: row.isActive,
  created_at: row.createdAt,
  updated_at: row.updatedAt,
});

const transformSmsGateway = (row: typeof smsGatewaySettings.$inferSelect): SmsGatewaySettings => ({
  id: row.id,
  app_id: row.appId,
  tenant_id: row.tenantId,
  gateway_type: row.gatewayType,
  settings: (row.settings as Record<string, unknown>) || {},
  is_active: row.isActive,
  created_at: row.createdAt,
  updated_at: row.updatedAt,
});

const transformEmailGateway = (row: typeof emailGatewaySettings.$inferSelect): EmailGatewaySettings => ({
  id: row.id,
  app_id: row.appId,
  tenant_id: row.tenantId,
  gateway_type: row.gatewayType,
  settings: (row.settings as Record<string, unknown>) || {},
  is_active: row.isActive,
  created_at: row.createdAt,
  updated_at: row.updatedAt,
});

const transformPaymentReceiver = (row: typeof paymentReceiverSettings.$inferSelect): PaymentReceiverSettings => ({
  id: row.id,
  app_id: row.appId,
  tenant_id: row.tenantId,
  receiver_type: row.receiverType,
  settings: (row.settings as Record<string, unknown>) || {},
  is_active: row.isActive,
  created_at: row.createdAt,
  updated_at: row.updatedAt,
});

// Payment Gateway Settings
export const getPaymentGateway = async (
  appId: string,
  tenantId: string,
  gatewayType: string
): Promise<PaymentGatewaySettings | null> => {
  const [settings] = await db
    .select()
    .from(paymentGatewaySettings)
    .where(
      and(
        eq(paymentGatewaySettings.appId, appId),
        eq(paymentGatewaySettings.tenantId, tenantId),
        eq(paymentGatewaySettings.gatewayType, gatewayType)
      )
    )
    .limit(1);

  return settings ? transformPaymentGateway(settings) : null;
};

export const createPaymentGateway = async (
  appId: string,
  tenantId: string,
  data: CreatePaymentGatewayRequest
): Promise<PaymentGatewaySettings> => {
  const [settings] = await db
    .insert(paymentGatewaySettings)
    .values({
      appId,
      tenantId,
      gatewayType: data.gateway_type,
      settings: data.settings,
      isActive: data.is_active ?? true,
    })
    .returning();

  return transformPaymentGateway(settings);
};

export const updatePaymentGateway = async (
  appId: string,
  tenantId: string,
  gatewayType: string,
  data: UpdatePaymentGatewayRequest
): Promise<PaymentGatewaySettings | null> => {
  const updates: Partial<typeof paymentGatewaySettings.$inferInsert> = { updatedAt: new Date() };
  if (data.settings !== undefined) updates.settings = data.settings;
  if (data.is_active !== undefined) updates.isActive = data.is_active;

  const [settings] = await db
    .update(paymentGatewaySettings)
    .set(updates)
    .where(
      and(
        eq(paymentGatewaySettings.appId, appId),
        eq(paymentGatewaySettings.tenantId, tenantId),
        eq(paymentGatewaySettings.gatewayType, gatewayType)
      )
    )
    .returning();

  return settings ? transformPaymentGateway(settings) : null;
};

export const deletePaymentGateway = async (
  appId: string,
  tenantId: string,
  gatewayType: string
): Promise<boolean> => {
  const result = await db
    .delete(paymentGatewaySettings)
    .where(
      and(
        eq(paymentGatewaySettings.appId, appId),
        eq(paymentGatewaySettings.tenantId, tenantId),
        eq(paymentGatewaySettings.gatewayType, gatewayType)
      )
    )
    .returning({ id: paymentGatewaySettings.id });

  return result.length > 0;
};

// Domain Settings
export const getDomain = async (
  appId: string,
  tenantId: string,
  domain: string
): Promise<DomainSettings | null> => {
  const [settings] = await db
    .select()
    .from(domainSettings)
    .where(
      and(
        eq(domainSettings.appId, appId),
        eq(domainSettings.tenantId, tenantId),
        eq(domainSettings.domain, domain)
      )
    )
    .limit(1);

  return settings ? transformDomain(settings) : null;
};

export const createDomain = async (
  appId: string,
  tenantId: string,
  data: CreateDomainRequest
): Promise<DomainSettings> => {
  const [settings] = await db
    .insert(domainSettings)
    .values({
      appId,
      tenantId,
      domain: data.domain,
      settings: data.settings || {},
      isActive: data.is_active ?? true,
    })
    .returning();

  return transformDomain(settings);
};

export const updateDomain = async (
  appId: string,
  tenantId: string,
  domain: string,
  data: UpdateDomainRequest
): Promise<DomainSettings | null> => {
  const updates: Partial<typeof domainSettings.$inferInsert> = { updatedAt: new Date() };
  if (data.domain !== undefined) updates.domain = data.domain;
  if (data.settings !== undefined) updates.settings = data.settings;
  if (data.is_active !== undefined) updates.isActive = data.is_active;

  const [settings] = await db
    .update(domainSettings)
    .set(updates)
    .where(
      and(
        eq(domainSettings.appId, appId),
        eq(domainSettings.tenantId, tenantId),
        eq(domainSettings.domain, domain)
      )
    )
    .returning();

  return settings ? transformDomain(settings) : null;
};

export const deleteDomain = async (
  appId: string,
  tenantId: string,
  domain: string
): Promise<boolean> => {
  const result = await db
    .delete(domainSettings)
    .where(
      and(
        eq(domainSettings.appId, appId),
        eq(domainSettings.tenantId, tenantId),
        eq(domainSettings.domain, domain)
      )
    )
    .returning({ id: domainSettings.id });

  return result.length > 0;
};

export const getDomainOwnerByDomain = async (
  domain: string
): Promise<DomainSettings | null> => {
  const [settings] = await db
    .select()
    .from(domainSettings)
    .where(eq(domainSettings.domain, domain))
    .limit(1);

  return settings ? transformDomain(settings) : null;
};

// SMS Gateway Settings
export const getSmsGateway = async (
  appId: string,
  tenantId: string,
  gatewayType: string
): Promise<SmsGatewaySettings | null> => {
  const [settings] = await db
    .select()
    .from(smsGatewaySettings)
    .where(
      and(
        eq(smsGatewaySettings.appId, appId),
        eq(smsGatewaySettings.tenantId, tenantId),
        eq(smsGatewaySettings.gatewayType, gatewayType)
      )
    )
    .limit(1);

  return settings ? transformSmsGateway(settings) : null;
};

export const createSmsGateway = async (
  appId: string,
  tenantId: string,
  data: CreateSmsGatewayRequest
): Promise<SmsGatewaySettings> => {
  const [settings] = await db
    .insert(smsGatewaySettings)
    .values({
      appId,
      tenantId,
      gatewayType: data.gateway_type,
      settings: data.settings,
      isActive: data.is_active ?? true,
    })
    .returning();

  return transformSmsGateway(settings);
};

export const updateSmsGateway = async (
  appId: string,
  tenantId: string,
  gatewayType: string,
  data: UpdateSmsGatewayRequest
): Promise<SmsGatewaySettings | null> => {
  const updates: Partial<typeof smsGatewaySettings.$inferInsert> = { updatedAt: new Date() };
  if (data.settings !== undefined) updates.settings = data.settings;
  if (data.is_active !== undefined) updates.isActive = data.is_active;

  const [settings] = await db
    .update(smsGatewaySettings)
    .set(updates)
    .where(
      and(
        eq(smsGatewaySettings.appId, appId),
        eq(smsGatewaySettings.tenantId, tenantId),
        eq(smsGatewaySettings.gatewayType, gatewayType)
      )
    )
    .returning();

  return settings ? transformSmsGateway(settings) : null;
};

export const deleteSmsGateway = async (
  appId: string,
  tenantId: string,
  gatewayType: string
): Promise<boolean> => {
  const result = await db
    .delete(smsGatewaySettings)
    .where(
      and(
        eq(smsGatewaySettings.appId, appId),
        eq(smsGatewaySettings.tenantId, tenantId),
        eq(smsGatewaySettings.gatewayType, gatewayType)
      )
    )
    .returning({ id: smsGatewaySettings.id });

  return result.length > 0;
};

// Email Gateway Settings
export const getEmailGateway = async (
  appId: string,
  tenantId: string,
  gatewayType: string
): Promise<EmailGatewaySettings | null> => {
  const [settings] = await db
    .select()
    .from(emailGatewaySettings)
    .where(
      and(
        eq(emailGatewaySettings.appId, appId),
        eq(emailGatewaySettings.tenantId, tenantId),
        eq(emailGatewaySettings.gatewayType, gatewayType)
      )
    )
    .limit(1);

  return settings ? transformEmailGateway(settings) : null;
};

export const createEmailGateway = async (
  appId: string,
  tenantId: string,
  data: CreateEmailGatewayRequest
): Promise<EmailGatewaySettings> => {
  const [settings] = await db
    .insert(emailGatewaySettings)
    .values({
      appId,
      tenantId,
      gatewayType: data.gateway_type,
      settings: data.settings,
      isActive: data.is_active ?? true,
    })
    .returning();

  return transformEmailGateway(settings);
};

export const updateEmailGateway = async (
  appId: string,
  tenantId: string,
  gatewayType: string,
  data: UpdateEmailGatewayRequest
): Promise<EmailGatewaySettings | null> => {
  const updates: Partial<typeof emailGatewaySettings.$inferInsert> = { updatedAt: new Date() };
  if (data.settings !== undefined) updates.settings = data.settings;
  if (data.is_active !== undefined) updates.isActive = data.is_active;

  const [settings] = await db
    .update(emailGatewaySettings)
    .set(updates)
    .where(
      and(
        eq(emailGatewaySettings.appId, appId),
        eq(emailGatewaySettings.tenantId, tenantId),
        eq(emailGatewaySettings.gatewayType, gatewayType)
      )
    )
    .returning();

  return settings ? transformEmailGateway(settings) : null;
};

export const deleteEmailGateway = async (
  appId: string,
  tenantId: string,
  gatewayType: string
): Promise<boolean> => {
  const result = await db
    .delete(emailGatewaySettings)
    .where(
      and(
        eq(emailGatewaySettings.appId, appId),
        eq(emailGatewaySettings.tenantId, tenantId),
        eq(emailGatewaySettings.gatewayType, gatewayType)
      )
    )
    .returning({ id: emailGatewaySettings.id });

  return result.length > 0;
};

// Payment Receiver Settings
export const getPaymentReceiver = async (
  appId: string,
  tenantId: string,
  receiverType: string
): Promise<PaymentReceiverSettings | null> => {
  const [settings] = await db
    .select()
    .from(paymentReceiverSettings)
    .where(
      and(
        eq(paymentReceiverSettings.appId, appId),
        eq(paymentReceiverSettings.tenantId, tenantId),
        eq(paymentReceiverSettings.receiverType, receiverType)
      )
    )
    .limit(1);

  return settings ? transformPaymentReceiver(settings) : null;
};

export const createPaymentReceiver = async (
  appId: string,
  tenantId: string,
  data: CreatePaymentReceiverRequest
): Promise<PaymentReceiverSettings> => {
  const [settings] = await db
    .insert(paymentReceiverSettings)
    .values({
      appId,
      tenantId,
      receiverType: data.receiver_type,
      settings: data.settings,
      isActive: data.is_active ?? true,
    })
    .returning();

  return transformPaymentReceiver(settings);
};

export const updatePaymentReceiver = async (
  appId: string,
  tenantId: string,
  receiverType: string,
  data: UpdatePaymentReceiverRequest
): Promise<PaymentReceiverSettings | null> => {
  const updates: Partial<typeof paymentReceiverSettings.$inferInsert> = { updatedAt: new Date() };
  if (data.settings !== undefined) updates.settings = data.settings;
  if (data.is_active !== undefined) updates.isActive = data.is_active;

  const [settings] = await db
    .update(paymentReceiverSettings)
    .set(updates)
    .where(
      and(
        eq(paymentReceiverSettings.appId, appId),
        eq(paymentReceiverSettings.tenantId, tenantId),
        eq(paymentReceiverSettings.receiverType, receiverType)
      )
    )
    .returning();

  return settings ? transformPaymentReceiver(settings) : null;
};

export const deletePaymentReceiver = async (
  appId: string,
  tenantId: string,
  receiverType: string
): Promise<boolean> => {
  const result = await db
    .delete(paymentReceiverSettings)
    .where(
      and(
        eq(paymentReceiverSettings.appId, appId),
        eq(paymentReceiverSettings.tenantId, tenantId),
        eq(paymentReceiverSettings.receiverType, receiverType)
      )
    )
    .returning({ id: paymentReceiverSettings.id });

  return result.length > 0;
};
