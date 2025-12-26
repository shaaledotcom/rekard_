import { pgTable, serial, uuid, varchar, jsonb, boolean, timestamp, index, unique } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';

export const paymentGatewaySettings = pgTable('payment_gateway_settings', {
  id: serial('id').primaryKey(),
  appId: varchar('app_id', { length: 255 }).notNull().default('public'),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  gatewayType: varchar('gateway_type', { length: 100 }).notNull(),
  settings: jsonb('settings').notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  tenantGatewayUnique: unique('payment_gateway_settings_tenant_gateway_unique').on(table.tenantId, table.gatewayType),
  tenantIdx: index('idx_payment_gateway_settings_tenant').on(table.tenantId),
}));

export const domainSettings = pgTable('domain_settings', {
  id: serial('id').primaryKey(),
  appId: varchar('app_id', { length: 255 }).notNull().default('public'),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  domain: varchar('domain', { length: 255 }).notNull(),
  settings: jsonb('settings').notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  tenantDomainUnique: unique('domain_settings_tenant_domain_unique').on(table.tenantId, table.domain),
  tenantIdx: index('idx_domain_settings_tenant').on(table.tenantId),
  domainIdx: index('idx_domain_settings_domain').on(table.domain),
}));

export const smsGatewaySettings = pgTable('sms_gateway_settings', {
  id: serial('id').primaryKey(),
  appId: varchar('app_id', { length: 255 }).notNull().default('public'),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  gatewayType: varchar('gateway_type', { length: 100 }).notNull(),
  settings: jsonb('settings').notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  tenantGatewayUnique: unique('sms_gateway_settings_tenant_gateway_unique').on(table.tenantId, table.gatewayType),
  tenantIdx: index('idx_sms_gateway_settings_tenant').on(table.tenantId),
}));

export const emailGatewaySettings = pgTable('email_gateway_settings', {
  id: serial('id').primaryKey(),
  appId: varchar('app_id', { length: 255 }).notNull().default('public'),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  gatewayType: varchar('gateway_type', { length: 100 }).notNull(),
  settings: jsonb('settings').notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  tenantGatewayUnique: unique('email_gateway_settings_tenant_gateway_unique').on(table.tenantId, table.gatewayType),
  tenantIdx: index('idx_email_gateway_settings_tenant').on(table.tenantId),
}));

export const paymentReceiverSettings = pgTable('payment_receiver_settings', {
  id: serial('id').primaryKey(),
  appId: varchar('app_id', { length: 255 }).notNull().default('public'),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  receiverType: varchar('receiver_type', { length: 100 }).notNull(),
  settings: jsonb('settings').notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  tenantReceiverUnique: unique('payment_receiver_settings_tenant_receiver_unique').on(table.tenantId, table.receiverType),
  tenantIdx: index('idx_payment_receiver_settings_tenant').on(table.tenantId),
}));

