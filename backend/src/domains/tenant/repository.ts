// Tenant repository - database operations for tenant management
import { eq, and, sql } from 'drizzle-orm';
import { db, tenants, viewerTenantMappings } from '../../db/index';
import type {
  Tenant,
  ViewerTenantMapping,
  CreateTenantRequest,
  CreateViewerMappingRequest,
  ViewerSource,
  ViewerStatus,
  TenantScopedTable,
} from './types';

// ===== Tenants =====

/**
 * Transform tenant database row to API response format
 */
const transformTenant = (row: typeof tenants.$inferSelect): Tenant => ({
  id: row.id,
  user_id: row.userId,
  app_id: row.appId,
  is_pro: row.isPro ?? false,
  pro_activated_at: row.proActivatedAt ?? undefined,
  primary_domain: row.primaryDomain ?? undefined,
  status: row.status ?? 'active',
  created_at: row.createdAt,
  updated_at: row.updatedAt,
});

/**
 * Create a new tenant (called on producer signup)
 */
export const createTenant = async (
  data: CreateTenantRequest
): Promise<Tenant> => {
  const [tenant] = await db
    .insert(tenants)
    .values({
      userId: data.user_id,
      appId: data.app_id || 'public',
      isPro: false,
      status: 'active',
    })
    .returning();

  return transformTenant(tenant);
};

/**
 * Get tenant by ID (UUID)
 */
export const getTenantById = async (
  tenantId: string
): Promise<Tenant | null> => {
  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  return tenant ? transformTenant(tenant) : null;
};

/**
 * Get tenant by user ID (Supabase user ID)
 */
export const getTenantByUserId = async (
  userId: string
): Promise<Tenant | null> => {
  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.userId, userId))
    .limit(1);

  return tenant ? transformTenant(tenant) : null;
};

/**
 * Get or create tenant for a user (auto-generate on first access)
 */
export const getOrCreateTenant = async (
  userId: string
): Promise<{ tenant: Tenant; created: boolean }> => {
  // Try to get existing tenant
  const existing = await getTenantByUserId(userId);
  if (existing) {
    return { tenant: existing, created: false };
  }

  // Create new tenant for this producer
  const tenant = await createTenant({
    user_id: userId,
    app_id: 'public', // Start with public, changes on Pro upgrade
  });

  return { tenant, created: true };
};

/**
 * Get tenant by domain
 */
export const getTenantByDomain = async (
  domain: string
): Promise<Tenant | null> => {
  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.primaryDomain, domain))
    .limit(1);

  return tenant ? transformTenant(tenant) : null;
};

/**
 * Activate Pro for a tenant - updates appId and sets isPro
 */
export const activateTenantPro = async (
  tenantId: string,
  newAppId: string
): Promise<Tenant> => {
  const [updated] = await db
    .update(tenants)
    .set({
      appId: newAppId,
      isPro: true,
      proActivatedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(tenants.id, tenantId))
    .returning();

  return transformTenant(updated);
};

/**
 * Update tenant's appId (triggers cascade to child tables via FK)
 */
export const updateTenantAppId = async (
  tenantId: string,
  newAppId: string
): Promise<Tenant | null> => {
  const [updated] = await db
    .update(tenants)
    .set({
      appId: newAppId,
      updatedAt: new Date(),
    })
    .where(eq(tenants.id, tenantId))
    .returning();

  return updated ? transformTenant(updated) : null;
};

/**
 * Update tenant's primary domain
 */
export const updateTenantDomain = async (
  tenantId: string,
  domain: string | null
): Promise<boolean> => {
  const result = await db
    .update(tenants)
    .set({
      primaryDomain: domain,
      updatedAt: new Date(),
    })
    .where(eq(tenants.id, tenantId))
    .returning({ id: tenants.id });

  return result.length > 0;
};

/**
 * Update tenant status
 */
export const updateTenantStatus = async (
  tenantId: string,
  status: string
): Promise<boolean> => {
  const result = await db
    .update(tenants)
    .set({
      status,
      updatedAt: new Date(),
    })
    .where(eq(tenants.id, tenantId))
    .returning({ id: tenants.id });

  return result.length > 0;
};

// ===== Viewer-Tenant Mappings =====

/**
 * Transform viewer mapping database row to API response format
 */
const transformViewerMapping = (row: typeof viewerTenantMappings.$inferSelect): ViewerTenantMapping => ({
  id: row.id,
  viewer_user_id: row.viewerUserId,
  tenant_id: row.tenantId,
  source: row.source as ViewerSource,
  first_order_id: row.firstOrderId ?? undefined,
  status: (row.status as ViewerStatus) ?? 'active',
  created_at: row.createdAt,
  updated_at: row.updatedAt,
});

/**
 * Create a viewer-tenant mapping
 */
export const createViewerMapping = async (
  data: CreateViewerMappingRequest
): Promise<ViewerTenantMapping> => {
  const [mapping] = await db
    .insert(viewerTenantMappings)
    .values({
      viewerUserId: data.viewer_user_id,
      tenantId: data.tenant_id,
      source: data.source,
      firstOrderId: data.first_order_id,
    })
    .returning();

  return transformViewerMapping(mapping);
};

/**
 * Get viewer mapping by viewer and tenant
 */
export const getViewerMapping = async (
  viewerUserId: string,
  tenantId: string
): Promise<ViewerTenantMapping | null> => {
  const [mapping] = await db
    .select()
    .from(viewerTenantMappings)
    .where(
      and(
        eq(viewerTenantMappings.viewerUserId, viewerUserId),
        eq(viewerTenantMappings.tenantId, tenantId)
      )
    )
    .limit(1);

  return mapping ? transformViewerMapping(mapping) : null;
};

/**
 * Get or create viewer mapping (upsert)
 */
export const getOrCreateViewerMapping = async (
  data: CreateViewerMappingRequest
): Promise<{ mapping: ViewerTenantMapping; created: boolean }> => {
  const existing = await getViewerMapping(data.viewer_user_id, data.tenant_id);
  
  if (existing) {
    return { mapping: existing, created: false };
  }

  const mapping = await createViewerMapping(data);
  return { mapping, created: true };
};

/**
 * Get all tenants a viewer belongs to
 */
export const getViewerTenants = async (
  viewerUserId: string
): Promise<ViewerTenantMapping[]> => {
  const mappings = await db
    .select()
    .from(viewerTenantMappings)
    .where(eq(viewerTenantMappings.viewerUserId, viewerUserId));

  return mappings.map(transformViewerMapping);
};

/**
 * Get all viewers for a tenant
 */
export const getTenantViewers = async (
  tenantId: string,
  limit: number = 100,
  offset: number = 0
): Promise<{ data: ViewerTenantMapping[]; total: number }> => {
  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(viewerTenantMappings)
    .where(eq(viewerTenantMappings.tenantId, tenantId));

  const total = countResult?.count || 0;

  const mappings = await db
    .select()
    .from(viewerTenantMappings)
    .where(eq(viewerTenantMappings.tenantId, tenantId))
    .limit(limit)
    .offset(offset);

  return {
    data: mappings.map(transformViewerMapping),
    total,
  };
};

/**
 * Update viewer mapping status
 */
export const updateViewerMappingStatus = async (
  viewerUserId: string,
  tenantId: string,
  status: ViewerStatus
): Promise<boolean> => {
  const result = await db
    .update(viewerTenantMappings)
    .set({ status, updatedAt: new Date() })
    .where(
      and(
        eq(viewerTenantMappings.viewerUserId, viewerUserId),
        eq(viewerTenantMappings.tenantId, tenantId)
      )
    )
    .returning({ id: viewerTenantMappings.id });

  return result.length > 0;
};

// ===== Cascade Update Operations (App-Level) =====

/**
 * Update appId across a specific table
 * This is used when tenant.appId changes and we need to update child tables
 * Note: With proper FK setup, this may not be needed if using ON UPDATE CASCADE
 */
export const updateAppIdInTable = async (
  tableName: TenantScopedTable,
  tenantId: string,
  oldAppId: string,
  newAppId: string
): Promise<number> => {
  // Use raw SQL for dynamic table name
  const result = await db.execute(sql`
    UPDATE ${sql.identifier(tableName)}
    SET app_id = ${newAppId}, updated_at = NOW()
    WHERE tenant_id = ${tenantId} AND app_id = ${oldAppId}
  `);

  return (result as { rowCount?: number }).rowCount || 0;
};

/**
 * Cascade update appId across all tenant-scoped tables
 * Called when a tenant upgrades to Pro and their appId changes
 */
export const cascadeUpdateAppId = async (
  tenantId: string,
  oldAppId: string,
  newAppId: string,
  tables: readonly TenantScopedTable[]
): Promise<{ table_name: string; rows_affected: number }[]> => {
  const results: { table_name: string; rows_affected: number }[] = [];

  for (const tableName of tables) {
    try {
      const rowsAffected = await updateAppIdInTable(tableName, tenantId, oldAppId, newAppId);
      results.push({ table_name: tableName, rows_affected: rowsAffected });
    } catch (error) {
      console.error(`Error updating ${tableName}:`, error);
      results.push({ table_name: tableName, rows_affected: -1 });
    }
  }

  return results;
};

