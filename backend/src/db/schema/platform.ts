import { pgTable, serial, varchar, jsonb, timestamp, index, unique } from 'drizzle-orm/pg-core';

export const platformSettings = pgTable('platform_settings', {
  id: serial('id').primaryKey(),
  appId: varchar('app_id', { length: 255 }).notNull(),
  tenantId: varchar('tenant_id', { length: 255 }).notNull(),
  settingKey: varchar('setting_key', { length: 255 }).notNull(),
  settingValue: jsonb('setting_value').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  appTenantKeyUnique: unique('platform_settings_app_tenant_key_unique').on(table.appId, table.tenantId, table.settingKey),
  appTenantIdx: index('idx_platform_settings_app_tenant').on(table.appId, table.tenantId),
}));

