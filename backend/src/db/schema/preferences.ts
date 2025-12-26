import { pgTable, serial, uuid, varchar, boolean, timestamp, index, unique } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';

export const userPreferences = pgTable('user_preferences', {
  id: serial('id').primaryKey(),
  appId: varchar('app_id', { length: 255 }).notNull().default('public'),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  userId: varchar('user_id', { length: 255 }).notNull(),
  theme: varchar('theme', { length: 50 }).default('light'),
  language: varchar('language', { length: 10 }).default('en'),
  timezone: varchar('timezone', { length: 100 }),
  notificationsEnabled: boolean('notifications_enabled').default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  tenantUserUnique: unique('user_preferences_tenant_user_unique').on(table.tenantId, table.userId),
  tenantIdx: index('idx_user_preferences_tenant').on(table.tenantId),
  userIdIdx: index('idx_user_preferences_user_id').on(table.userId),
}));

