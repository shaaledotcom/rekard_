import { pgTable, serial, uuid, varchar, decimal, boolean, timestamp, index, unique } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';

export const currencies = pgTable('currencies', {
  id: serial('id').primaryKey(),
  appId: varchar('app_id', { length: 255 }).notNull().default('public'),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  code: varchar('code', { length: 10 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  symbol: varchar('symbol', { length: 10 }),
  exchangeRate: decimal('exchange_rate', { precision: 10, scale: 4 }).default('1.0'),
  isActive: boolean('is_active').default(true),
  isDefault: boolean('is_default').default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  tenantCodeUnique: unique('currencies_tenant_code_unique').on(table.tenantId, table.code),
  tenantIdx: index('idx_currencies_tenant').on(table.tenantId),
}));

