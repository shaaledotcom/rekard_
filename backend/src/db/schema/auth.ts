import { pgTable, uuid, varchar, timestamp, index, unique } from 'drizzle-orm/pg-core';

// System tenant UUID - used for global/public resources
export const SYSTEM_TENANT_ID = '00000000-0000-0000-0000-000000000000';
export const DEFAULT_APP_ID = 'public';

// Roles table
export const roles = pgTable('roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  nameIdx: index('idx_roles_name').on(table.name),
}));

// Role permissions table
export const rolePermissions = pgTable('role_permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  roleId: uuid('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  permission: varchar('permission', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  roleIdIdx: index('idx_role_permissions_role_id').on(table.roleId),
  rolePermissionUnique: unique('role_permissions_role_id_permission_unique').on(table.roleId, table.permission),
}));

// User metadata table
export const userMetadata = pgTable('user_metadata', {
  userId: varchar('user_id', { length: 255 }).primaryKey(), // Supabase user ID
  appId: varchar('app_id', { length: 255 }).notNull().default(DEFAULT_APP_ID),
  tenantId: varchar('tenant_id', { length: 255 }).notNull().default(SYSTEM_TENANT_ID),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  tenantIdIdx: index('idx_user_metadata_tenant_id').on(table.tenantId),
  appIdIdx: index('idx_user_metadata_app_id').on(table.appId),
}));

// User roles table
export const userRoles = pgTable('user_roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: varchar('user_id', { length: 255 }).notNull(), // Supabase user ID
  roleId: uuid('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  tenantId: varchar('tenant_id', { length: 255 }).notNull().default(SYSTEM_TENANT_ID),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_user_roles_user_id').on(table.userId),
  tenantIdIdx: index('idx_user_roles_tenant_id').on(table.tenantId),
  userTenantIdx: index('idx_user_roles_user_tenant').on(table.userId, table.tenantId),
  userRoleTenantUnique: unique('user_roles_user_id_role_id_tenant_id_unique').on(table.userId, table.roleId, table.tenantId),
}));

