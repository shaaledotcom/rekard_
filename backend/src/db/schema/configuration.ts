import { pgTable, serial, varchar, jsonb, boolean, timestamp, index, unique } from 'drizzle-orm/pg-core';

export const paymentGatewaySettings = pgTable('payment_gateway_settings', {
  id: serial('id').primaryKey(),
  appId: varchar('app_id', { length: 255 }).notNull(),
  tenantId: varchar('tenant_id', { length: 255 }).notNull(),
  gatewayType: varchar('gateway_type', { length: 100 }).notNull(),
  settings: jsonb('settings').notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  appTenantGatewayUnique: unique('payment_gateway_settings_app_tenant_gateway_unique').on(table.appId, table.tenantId, table.gatewayType),
  appTenantIdx: index('idx_payment_gateway_settings_app_tenant').on(table.appId, table.tenantId),
}));

export const domainSettings = pgTable('domain_settings', {
  id: serial('id').primaryKey(),
  appId: varchar('app_id', { length: 255 }).notNull(),
  tenantId: varchar('tenant_id', { length: 255 }).notNull(),
  domain: varchar('domain', { length: 255 }).notNull(),
  settings: jsonb('settings').notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  appTenantDomainUnique: unique('domain_settings_app_tenant_domain_unique').on(table.appId, table.tenantId, table.domain),
  domainIdx: index('idx_domain_settings_domain').on(table.domain),
}));

export const smsGatewaySettings = pgTable('sms_gateway_settings', {
  id: serial('id').primaryKey(),
  appId: varchar('app_id', { length: 255 }).notNull(),
  tenantId: varchar('tenant_id', { length: 255 }).notNull(),
  gatewayType: varchar('gateway_type', { length: 100 }).notNull(),
  settings: jsonb('settings').notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  appTenantGatewayUnique: unique('sms_gateway_settings_app_tenant_gateway_unique').on(table.appId, table.tenantId, table.gatewayType),
  appTenantIdx: index('idx_sms_gateway_settings_app_tenant').on(table.appId, table.tenantId),
}));

export const emailGatewaySettings = pgTable('email_gateway_settings', {
  id: serial('id').primaryKey(),
  appId: varchar('app_id', { length: 255 }).notNull(),
  tenantId: varchar('tenant_id', { length: 255 }).notNull(),
  gatewayType: varchar('gateway_type', { length: 100 }).notNull(),
  settings: jsonb('settings').notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  appTenantGatewayUnique: unique('email_gateway_settings_app_tenant_gateway_unique').on(table.appId, table.tenantId, table.gatewayType),
  appTenantIdx: index('idx_email_gateway_settings_app_tenant').on(table.appId, table.tenantId),
}));

export const paymentReceiverSettings = pgTable('payment_receiver_settings', {
  id: serial('id').primaryKey(),
  appId: varchar('app_id', { length: 255 }).notNull(),
  tenantId: varchar('tenant_id', { length: 255 }).notNull(),
  receiverType: varchar('receiver_type', { length: 100 }).notNull(),
  settings: jsonb('settings').notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  appTenantReceiverUnique: unique('payment_receiver_settings_app_tenant_receiver_unique').on(table.appId, table.tenantId, table.receiverType),
  appTenantIdx: index('idx_payment_receiver_settings_app_tenant').on(table.appId, table.tenantId),
}));

