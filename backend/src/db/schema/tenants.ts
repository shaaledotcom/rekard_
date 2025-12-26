import { pgTable, uuid, varchar, boolean, integer, timestamp, index, unique } from 'drizzle-orm/pg-core';

/**
 * Tenants Table (Core Multi-Tenancy)
 * 
 * Each producer gets a tenant row auto-generated on signup.
 * This is the parent table that all tenant-scoped data references via FK.
 * 
 * - userId: The producer's Supabase user ID (unique)
 * - appId: 'public' for free users, unique ID for Pro users
 * - All other tables reference tenants.id with ON UPDATE CASCADE
 */
export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // The producer's Supabase user ID (unique - one tenant per producer)
  userId: varchar('user_id', { length: 255 }).notNull().unique(),
  
  // App ID - 'public' for free, changes to unique ID on Pro upgrade
  // This is the value that gets cascaded to all child tables
  appId: varchar('app_id', { length: 255 }).notNull().default('public'),
  
  // Pro status
  isPro: boolean('is_pro').default(false),
  proActivatedAt: timestamp('pro_activated_at'),
  
  // Primary domain for quick lookup (viewer page resolution)
  primaryDomain: varchar('primary_domain', { length: 255 }),
  
  // Tenant status
  status: varchar('status', { length: 50 }).default('active'), // active, suspended, deleted
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_tenants_user_id').on(table.userId),
  appIdIdx: index('idx_tenants_app_id').on(table.appId),
  domainIdx: index('idx_tenants_domain').on(table.primaryDomain),
  statusIdx: index('idx_tenants_status').on(table.status),
}));

/**
 * Viewer-Tenant Mappings
 * 
 * Tracks which viewers (ticket purchasers) belong to which tenants (producers).
 * A viewer can be part of multiple tenants by purchasing tickets from different producers.
 */
export const viewerTenantMappings = pgTable('viewer_tenant_mappings', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // The viewer's Supabase user ID
  viewerUserId: varchar('viewer_user_id', { length: 255 }).notNull(),
  
  // FK to tenants table
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  
  // How the viewer joined this tenant
  source: varchar('source', { length: 50 }).notNull().default('purchase'), // purchase, signup, invite, manual
  
  // Reference to first order (if source is purchase) - will be linked after orders table update
  firstOrderId: integer('first_order_id'),
  
  // Status of the viewer in this tenant
  status: varchar('status', { length: 50 }).default('active'), // active, blocked, inactive
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  // Each viewer can only be mapped once per tenant
  viewerTenantUnique: unique('viewer_tenant_mappings_viewer_tenant').on(table.viewerUserId, table.tenantId),
  
  // Index for looking up all viewers of a tenant
  tenantIdx: index('idx_viewer_tenant_mappings_tenant').on(table.tenantId),
  
  // Index for looking up all tenants a viewer belongs to
  viewerIdx: index('idx_viewer_tenant_mappings_viewer').on(table.viewerUserId),
  
  // Index for filtering by source
  sourceIdx: index('idx_viewer_tenant_mappings_source').on(table.source),
}));


