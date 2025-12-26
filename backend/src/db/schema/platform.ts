import { pgTable, serial, uuid, varchar, jsonb, timestamp, index, unique } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';

export const platformSettings = pgTable('platform_settings', {
  id: serial('id').primaryKey(),
  appId: varchar('app_id', { length: 255 }).notNull().default('public'),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  settingKey: varchar('setting_key', { length: 255 }).notNull(),
  settingValue: jsonb('setting_value').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  tenantKeyUnique: unique('platform_settings_tenant_key_unique').on(table.tenantId, table.settingKey),
  tenantIdx: index('idx_platform_settings_tenant').on(table.tenantId),
}));

