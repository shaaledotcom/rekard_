// Configuration service
import * as repo from './repository.js';
import type {
  ConfigurationSettings,
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
  PaymentGatewaySettings,
  DomainSettings,
  SmsGatewaySettings,
  EmailGatewaySettings,
  PaymentReceiverSettings,
} from './types.js';
import { log } from '../../shared/middleware/logger.js';

// Helper to create user-specific gateway/receiver type
const userGatewayType = (userId: string) => `user_${userId}`;
const userReceiverType = (userId: string) => `user_${userId}`;

// Get all configuration settings
export const getAllSettings = async (
  appId: string,
  tenantId: string,
  userId: string
): Promise<ConfigurationSettings> => {
  const gatewayType = userGatewayType(userId);
  const receiverType = userReceiverType(userId);

  // For domain, we need to get any domain for this tenant
  const [paymentGateway, smsGateway, emailGateway, paymentReceiver] =
    await Promise.all([
      repo.getPaymentGateway(appId, tenantId, gatewayType),
      repo.getSmsGateway(appId, tenantId, gatewayType),
      repo.getEmailGateway(appId, tenantId, gatewayType),
      repo.getPaymentReceiver(appId, tenantId, receiverType),
    ]);

  return {
    payment_gateway: paymentGateway || undefined,
    sms_gateway: smsGateway || undefined,
    email_gateway: emailGateway || undefined,
    payment_receiver: paymentReceiver || undefined,
  };
};

// Payment Gateway
export const getPaymentGateway = async (
  appId: string,
  tenantId: string,
  userId: string
): Promise<PaymentGatewaySettings | null> => {
  return repo.getPaymentGateway(appId, tenantId, userGatewayType(userId));
};

export const upsertPaymentGateway = async (
  appId: string,
  tenantId: string,
  userId: string,
  data: CreatePaymentGatewayRequest | UpdatePaymentGatewayRequest
): Promise<PaymentGatewaySettings> => {
  const gatewayType = userGatewayType(userId);
  const existing = await repo.getPaymentGateway(appId, tenantId, gatewayType);

  if (existing) {
    const updated = await repo.updatePaymentGateway(appId, tenantId, gatewayType, data);
    log.info(`Updated payment gateway settings for user ${userId}`);
    return updated!;
  }

  const createData: CreatePaymentGatewayRequest = {
    gateway_type: gatewayType,
    settings: (data as CreatePaymentGatewayRequest).settings || {},
    is_active: (data as CreatePaymentGatewayRequest).is_active,
  };
  const created = await repo.createPaymentGateway(appId, tenantId, createData);
  log.info(`Created payment gateway settings for user ${userId}`);
  return created;
};

export const deletePaymentGateway = async (
  appId: string,
  tenantId: string,
  userId: string
): Promise<boolean> => {
  const deleted = await repo.deletePaymentGateway(appId, tenantId, userGatewayType(userId));
  if (deleted) {
    log.info(`Deleted payment gateway settings for user ${userId}`);
  }
  return deleted;
};

// Domain
export const getDomain = async (
  appId: string,
  tenantId: string,
  domain: string
): Promise<DomainSettings | null> => {
  return repo.getDomain(appId, tenantId, domain);
};

export const getDomainByTenant = async (
  appId: string,
  tenantId: string
): Promise<DomainSettings | null> => {
  return repo.getFirstDomainByTenant(appId, tenantId);
};

export const upsertDomain = async (
  appId: string,
  tenantId: string,
  _userId: string,
  data: CreateDomainRequest | UpdateDomainRequest
): Promise<DomainSettings> => {
  const domainName = (data as CreateDomainRequest).domain || '';
  const existing = await repo.getDomain(appId, tenantId, domainName);

  if (existing) {
    const updated = await repo.updateDomain(appId, tenantId, domainName, data);
    log.info(`Updated domain settings for domain ${domainName}`);
    return updated!;
  }

  const created = await repo.createDomain(appId, tenantId, data as CreateDomainRequest);
  log.info(`Created domain settings for domain ${domainName}`);
  return created;
};

export const deleteDomain = async (
  appId: string,
  tenantId: string,
  domain: string
): Promise<boolean> => {
  const deleted = await repo.deleteDomain(appId, tenantId, domain);
  if (deleted) {
    log.info(`Deleted domain settings for domain ${domain}`);
  }
  return deleted;
};

export const resolveDomainOwner = async (
  domain: string
): Promise<DomainSettings | null> => {
  return repo.getDomainOwnerByDomain(domain);
};

// SMS Gateway
export const getSmsGateway = async (
  appId: string,
  tenantId: string,
  userId: string
): Promise<SmsGatewaySettings | null> => {
  return repo.getSmsGateway(appId, tenantId, userGatewayType(userId));
};

export const upsertSmsGateway = async (
  appId: string,
  tenantId: string,
  userId: string,
  data: CreateSmsGatewayRequest | UpdateSmsGatewayRequest
): Promise<SmsGatewaySettings> => {
  const gatewayType = userGatewayType(userId);
  const existing = await repo.getSmsGateway(appId, tenantId, gatewayType);

  if (existing) {
    const updated = await repo.updateSmsGateway(appId, tenantId, gatewayType, data);
    log.info(`Updated SMS gateway settings for user ${userId}`);
    return updated!;
  }

  const createData: CreateSmsGatewayRequest = {
    gateway_type: gatewayType,
    settings: (data as CreateSmsGatewayRequest).settings || {},
    is_active: (data as CreateSmsGatewayRequest).is_active,
  };
  const created = await repo.createSmsGateway(appId, tenantId, createData);
  log.info(`Created SMS gateway settings for user ${userId}`);
  return created;
};

export const deleteSmsGateway = async (
  appId: string,
  tenantId: string,
  userId: string
): Promise<boolean> => {
  const deleted = await repo.deleteSmsGateway(appId, tenantId, userGatewayType(userId));
  if (deleted) {
    log.info(`Deleted SMS gateway settings for user ${userId}`);
  }
  return deleted;
};

// Email Gateway
export const getEmailGateway = async (
  appId: string,
  tenantId: string,
  userId: string
): Promise<EmailGatewaySettings | null> => {
  return repo.getEmailGateway(appId, tenantId, userGatewayType(userId));
};

export const upsertEmailGateway = async (
  appId: string,
  tenantId: string,
  userId: string,
  data: CreateEmailGatewayRequest | UpdateEmailGatewayRequest
): Promise<EmailGatewaySettings> => {
  const gatewayType = userGatewayType(userId);
  const existing = await repo.getEmailGateway(appId, tenantId, gatewayType);

  if (existing) {
    const updated = await repo.updateEmailGateway(appId, tenantId, gatewayType, data);
    log.info(`Updated email gateway settings for user ${userId}`);
    return updated!;
  }

  const createData: CreateEmailGatewayRequest = {
    gateway_type: gatewayType,
    settings: (data as CreateEmailGatewayRequest).settings || {},
    is_active: (data as CreateEmailGatewayRequest).is_active,
  };
  const created = await repo.createEmailGateway(appId, tenantId, createData);
  log.info(`Created email gateway settings for user ${userId}`);
  return created;
};

export const deleteEmailGateway = async (
  appId: string,
  tenantId: string,
  userId: string
): Promise<boolean> => {
  const deleted = await repo.deleteEmailGateway(appId, tenantId, userGatewayType(userId));
  if (deleted) {
    log.info(`Deleted email gateway settings for user ${userId}`);
  }
  return deleted;
};

// Payment Receiver
export const getPaymentReceiver = async (
  appId: string,
  tenantId: string,
  userId: string
): Promise<PaymentReceiverSettings | null> => {
  return repo.getPaymentReceiver(appId, tenantId, userReceiverType(userId));
};

export const upsertPaymentReceiver = async (
  appId: string,
  tenantId: string,
  userId: string,
  data: CreatePaymentReceiverRequest | UpdatePaymentReceiverRequest
): Promise<PaymentReceiverSettings> => {
  const receiverType = userReceiverType(userId);
  const existing = await repo.getPaymentReceiver(appId, tenantId, receiverType);

  if (existing) {
    const updated = await repo.updatePaymentReceiver(appId, tenantId, receiverType, data);
    log.info(`Updated payment receiver settings for user ${userId}`);
    return updated!;
  }

  const createData: CreatePaymentReceiverRequest = {
    receiver_type: receiverType,
    settings: (data as CreatePaymentReceiverRequest).settings || {},
    is_active: (data as CreatePaymentReceiverRequest).is_active,
  };
  const created = await repo.createPaymentReceiver(appId, tenantId, createData);
  log.info(`Created payment receiver settings for user ${userId}`);
  return created;
};

export const deletePaymentReceiver = async (
  appId: string,
  tenantId: string,
  userId: string
): Promise<boolean> => {
  const deleted = await repo.deletePaymentReceiver(appId, tenantId, userReceiverType(userId));
  if (deleted) {
    log.info(`Deleted payment receiver settings for user ${userId}`);
  }
  return deleted;
};
