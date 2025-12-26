// Constants
export * from './constants.js';

// Types
export * from './types.js';

// Supabase initialization
export {
  initSupabase,
  setupDefaultRoles,
  setDomainOwnerProvider,
  getSupabaseClient,
  getSupabaseAdminClient,
  assignDefaultRoleToUser,
} from './supabase.js';

// Session middleware and utilities
export {
  optionalSession,
  requireSession,
  getUserIdFromSession,
  resolveTenantContext,
  refreshRolesMiddleware,
  tenantContextMiddleware,
  setGlobalDomainOwnerProvider,
  type AuthenticatedRequest,
} from './session.js';

// Role management
export {
  requireRole,
  requireAnyRole,
  requirePermission,
  requireAnyPermission,
  addRoleToUser,
  removeRoleFromUser,
  getRolesForUser,
  getAllRoles,
  getPermissionsForRole,
  createRoleOrAddPermissions,
  deleteRole,
} from './roles.js';

// User management
export {
  getUserById,
  getUserByEmail,
  getUserByPhone,
  getUserMetadataById,
  updateUserMetadata,
  getUserMetadata,
  createUser,
  changeUserTenant,
  changeUserApp,
  getUserTenantAndApp,
  getUsersByMetadata,
  getUserRoles,
  getUserPermissions,
} from './user.js';
