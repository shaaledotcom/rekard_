import { pgTable, serial, varchar, decimal, boolean, timestamp, index, unique } from 'drizzle-orm/pg-core';

export const currencies = pgTable('currencies', {
  id: serial('id').primaryKey(),
  appId: varchar('app_id', { length: 255 }).notNull(),
  tenantId: varchar('tenant_id', { length: 255 }).notNull(),
  code: varchar('code', { length: 10 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  symbol: varchar('symbol', { length: 10 }),
  exchangeRate: decimal('exchange_rate', { precision: 10, scale: 4 }).default('1.0'),
  isActive: boolean('is_active').default(true),
  isDefault: boolean('is_default').default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  appTenantCodeUnique: unique('currencies_app_tenant_code_unique').on(table.appId, table.tenantId, table.code),
  appTenantIdx: index('idx_currencies_app_tenant').on(table.appId, table.tenantId),
}));

