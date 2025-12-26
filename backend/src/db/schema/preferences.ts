import { pgTable, serial, varchar, boolean, timestamp, index, unique } from 'drizzle-orm/pg-core';

export const userPreferences = pgTable('user_preferences', {
  id: serial('id').primaryKey(),
  appId: varchar('app_id', { length: 255 }).notNull(),
  tenantId: varchar('tenant_id', { length: 255 }).notNull(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  theme: varchar('theme', { length: 50 }).default('light'),
  language: varchar('language', { length: 10 }).default('en'),
  timezone: varchar('timezone', { length: 100 }),
  notificationsEnabled: boolean('notifications_enabled').default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  appTenantUserUnique: unique('user_preferences_app_tenant_user_unique').on(table.appId, table.tenantId, table.userId),
  userIdIdx: index('idx_user_preferences_user_id').on(table.userId),
}));

