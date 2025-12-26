// Tenant service - business logic for tenant management
import * as repo from './repository.js';
import type {
  Tenant,
  ViewerTenantMapping,
  ActivateProRequest,
  CascadeUpdateResult,
  ViewerSource,
  TenantContextInfo,
} from './types.js';
import { TENANT_SCOPED_TABLES as ALL_TENANT_TABLES } from './types.js';
import { log } from '../../shared/middleware/logger.js';

// ===== Tenant Management =====

/**
 * Get or create tenant for a producer (auto-generate on first access)
 * This should be called when a producer first logs in or signs up
 */
export const getOrCreateTenantForUser = async (
  userId: string
): Promise<{ tenant: Tenant; isNew: boolean }> => {
  const { tenant, created } = await repo.getOrCreateTenant(userId);
  
  if (created) {
    log.info(`Auto-created tenant ${tenant.id} for producer ${userId}`);
  }
  
  return { tenant, isNew: created };
};

/**
 * Get tenant by ID (UUID)
 */
export const getTenantById = async (tenantId: string): Promise<Tenant | null> => {
  return repo.getTenantById(tenantId);
};

/**
 * Get tenant by user ID (producer's Supabase user ID)
 */
export const getTenantByUserId = async (userId: string): Promise<Tenant | null> => {
  return repo.getTenantByUserId(userId);
};

/**
 * Get tenant context for API calls
 * Auto-creates tenant if it doesn't exist
 */
export const getTenantContext = async (
  userId: string
): Promise<TenantContextInfo> => {
  const { tenant } = await getOrCreateTenantForUser(userId);
  
  return {
    tenantId: tenant.id,
    userId: tenant.user_id,
    appId: tenant.app_id,
    isPro: tenant.is_pro,
  };
};

/**
 * Check if a tenant is Pro
 */
export const isTenantPro = async (tenantId: string): Promise<boolean> => {
  const tenant = await repo.getTenantById(tenantId);
  return tenant?.is_pro ?? false;
};

// ===== Pro Activation =====

/**
 * Activate Pro for a tenant
 * - Updates their appId from 'public' to their unique ID
 * - Cascades the update across all tenant-scoped tables
 */
export const activatePro = async (
  request: ActivateProRequest
): Promise<CascadeUpdateResult> => {
  const { tenant_id, custom_app_id } = request;
  
  // Get current tenant
  const tenant = await repo.getTenantById(tenant_id);
  if (!tenant) {
    throw new Error(`Tenant not found: ${tenant_id}`);
  }
  
  const oldAppId = tenant.app_id;
  
  // New appId is either custom or defaults to tenant.id
  const newAppId = custom_app_id || tenant_id;
  
  // If already using this appId, no update needed
  if (oldAppId === newAppId && tenant.is_pro) {
    log.info(`Tenant ${tenant_id} already has appId: ${newAppId}`);
    return {
      success: true,
      old_app_id: oldAppId,
      new_app_id: newAppId,
      tables_updated: [],
      total_rows_affected: 0,
    };
  }
  
  log.info(`Activating Pro for tenant ${tenant_id}: ${oldAppId} -> ${newAppId}`);
  
  // Update tenant record (sets isPro, appId, proActivatedAt)
  await repo.activateTenantPro(tenant_id, newAppId);
  
  // Cascade update across all tables that still use appId
  // Note: Once we add FK to tenants.id, this may not be needed
  const updateResults = await repo.cascadeUpdateAppId(
    tenant_id,
    oldAppId,
    newAppId,
    ALL_TENANT_TABLES
  );
  
  const totalRowsAffected = updateResults.reduce((sum, r) => {
    return sum + (r.rows_affected > 0 ? r.rows_affected : 0);
  }, 0);
  
  const failedTables = updateResults.filter(r => r.rows_affected === -1);
  if (failedTables.length > 0) {
    log.warn(`Failed to update some tables: ${failedTables.map(t => t.table_name).join(', ')}`);
  }
  
  log.info(`Pro activation complete for tenant ${tenant_id}: ${totalRowsAffected} total rows updated`);
  
  return {
    success: failedTables.length === 0,
    old_app_id: oldAppId,
    new_app_id: newAppId,
    tables_updated: updateResults,
    total_rows_affected: totalRowsAffected,
  };
};

// ===== Domain Management =====

/**
 * Set primary domain for a tenant
 */
export const setTenantDomain = async (
  tenantId: string,
  domain: string
): Promise<boolean> => {
  const updated = await repo.updateTenantDomain(tenantId, domain);
  if (updated) {
    log.info(`Set primary domain for tenant ${tenantId}: ${domain}`);
  }
  return updated;
};

/**
 * Remove primary domain from a tenant
 */
export const removeTenantDomain = async (tenantId: string): Promise<boolean> => {
  const updated = await repo.updateTenantDomain(tenantId, null);
  if (updated) {
    log.info(`Removed primary domain from tenant ${tenantId}`);
  }
  return updated;
};

/**
 * Resolve tenant from domain
 * Returns the tenant for a given domain
 */
export const resolveTenantFromDomain = async (
  domain: string
): Promise<{ tenantId: string; appId: string } | null> => {
  const tenant = await repo.getTenantByDomain(domain);
  
  if (!tenant) {
    return null;
  }
  
  return {
    tenantId: tenant.id,
    appId: tenant.app_id,
  };
};

// ===== Viewer-Tenant Mappings =====

/**
 * Add a viewer to a tenant (creates mapping)
 * Called when a viewer purchases a ticket or signs up on a producer's page
 */
export const addViewerToTenant = async (
  viewerUserId: string,
  tenantId: string,
  source: ViewerSource,
  firstOrderId?: number
): Promise<{ mapping: ViewerTenantMapping; isNew: boolean }> => {
  const { mapping, created } = await repo.getOrCreateViewerMapping({
    viewer_user_id: viewerUserId,
    tenant_id: tenantId,
    source,
    first_order_id: firstOrderId,
  });

  if (created) {
    log.info(`Added viewer ${viewerUserId} to tenant ${tenantId} (source: ${source})`);
  }

  return { mapping, isNew: created };
};

/**
 * Get all tenants a viewer belongs to
 */
export const getViewerTenants = async (
  viewerUserId: string
): Promise<ViewerTenantMapping[]> => {
  return repo.getViewerTenants(viewerUserId);
};

/**
 * Get all viewers for a tenant (producer)
 */
export const getTenantViewers = async (
  tenantId: string,
  page: number = 1,
  pageSize: number = 100
): Promise<{ data: ViewerTenantMapping[]; total: number; page: number; page_size: number }> => {
  const offset = (page - 1) * pageSize;
  const { data, total } = await repo.getTenantViewers(tenantId, pageSize, offset);
  
  return {
    data,
    total,
    page,
    page_size: pageSize,
  };
};

/**
 * Check if a viewer belongs to a tenant
 */
export const isViewerInTenant = async (
  viewerUserId: string,
  tenantId: string
): Promise<boolean> => {
  const mapping = await repo.getViewerMapping(viewerUserId, tenantId);
  return mapping !== null && mapping.status === 'active';
};

/**
 * Block a viewer from a tenant
 */
export const blockViewerFromTenant = async (
  viewerUserId: string,
  tenantId: string
): Promise<boolean> => {
  const updated = await repo.updateViewerMappingStatus(viewerUserId, tenantId, 'blocked');
  if (updated) {
    log.info(`Blocked viewer ${viewerUserId} from tenant ${tenantId}`);
  }
  return updated;
};

/**
 * Unblock a viewer from a tenant
 */
export const unblockViewerFromTenant = async (
  viewerUserId: string,
  tenantId: string
): Promise<boolean> => {
  const updated = await repo.updateViewerMappingStatus(viewerUserId, tenantId, 'active');
  if (updated) {
    log.info(`Unblocked viewer ${viewerUserId} from tenant ${tenantId}`);
  }
  return updated;
};

// ===== Legacy Compatibility =====

/**
 * Get appId for a tenant (legacy - for backward compatibility)
 * @deprecated Use getTenantContext instead
 */
export const getTenantAppId = async (userId: string): Promise<string> => {
  const context = await getTenantContext(userId);
  return context.appId;
};

/**
 * Initialize tenant (legacy - now handled by getOrCreateTenantForUser)
 * @deprecated Use getOrCreateTenantForUser instead
 */
export const initializeTenant = async (userId: string): Promise<Tenant> => {
  const { tenant } = await getOrCreateTenantForUser(userId);
  return tenant;
};

