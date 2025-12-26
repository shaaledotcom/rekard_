// Configuration settings types

export type PaymentGatewaySettings = {
  id: number;
  app_id: string;
  tenant_id: string;
  gateway_type: string;
  settings: Record<string, unknown>;
  is_active: boolean | null;
  created_at: Date;
  updated_at: Date;
};

export type DomainSettings = {
  id: number;
  app_id: string;
  tenant_id: string;
  domain: string;
  settings: Record<string, unknown>;
  is_active: boolean | null;
  created_at: Date;
  updated_at: Date;
};

export type SmsGatewaySettings = {
  id: number;
  app_id: string;
  tenant_id: string;
  gateway_type: string;
  settings: Record<string, unknown>;
  is_active: boolean | null;
  created_at: Date;
  updated_at: Date;
};

export type EmailGatewaySettings = {
  id: number;
  app_id: string;
  tenant_id: string;
  gateway_type: string;
  settings: Record<string, unknown>;
  is_active: boolean | null;
  created_at: Date;
  updated_at: Date;
};

export type PaymentReceiverSettings = {
  id: number;
  app_id: string;
  tenant_id: string;
  receiver_type: string;
  settings: Record<string, unknown>;
  is_active: boolean | null;
  created_at: Date;
  updated_at: Date;
};

// Request types
export type CreatePaymentGatewayRequest = {
  gateway_type: string;
  settings: Record<string, unknown>;
  is_active?: boolean;
};

export type UpdatePaymentGatewayRequest = {
  settings?: Record<string, unknown>;
  is_active?: boolean;
};

export type CreateDomainRequest = {
  domain: string;
  settings?: Record<string, unknown>;
  is_active?: boolean;
};

export type UpdateDomainRequest = {
  domain?: string;
  settings?: Record<string, unknown>;
  is_active?: boolean;
};

export type CreateSmsGatewayRequest = {
  gateway_type: string;
  settings: Record<string, unknown>;
  is_active?: boolean;
};

export type UpdateSmsGatewayRequest = {
  settings?: Record<string, unknown>;
  is_active?: boolean;
};

export type CreateEmailGatewayRequest = {
  gateway_type: string;
  settings: Record<string, unknown>;
  is_active?: boolean;
};

export type UpdateEmailGatewayRequest = {
  settings?: Record<string, unknown>;
  is_active?: boolean;
};

export type CreatePaymentReceiverRequest = {
  receiver_type: string;
  settings: Record<string, unknown>;
  is_active?: boolean;
};

export type UpdatePaymentReceiverRequest = {
  settings?: Record<string, unknown>;
  is_active?: boolean;
};

// Combined configuration response
export type ConfigurationSettings = {
  payment_gateway?: PaymentGatewaySettings;
  domain?: DomainSettings;
  sms_gateway?: SmsGatewaySettings;
  email_gateway?: EmailGatewaySettings;
  payment_receiver?: PaymentReceiverSettings;
};
