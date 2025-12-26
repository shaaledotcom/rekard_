// User management service
import { eq } from 'drizzle-orm';
import { getSupabaseAdminClient } from '../auth/supabase.js';
import { db, userMetadata, userRoles } from '../../db/index';
import {
  getUserMetadataById,
  getUserRoles as getUserRolesList,
  getUserPermissions,
  addRoleToUser,
  removeRoleFromUser,
} from '../auth/index.js';
import type {
  UserProfile,
  UserListItem,
  UserListFilter,
  UserListResponse,
  UpdateUserProfileRequest,
  BulkUserActionRequest,
  BulkUserActionResponse,
} from './types.js';
import { log } from '../../shared/middleware/logger.js';
import { TENANT_PUBLIC } from '../auth/constants.js';

// Get user profile
export const getUserProfile = async (
  userId: string
): Promise<UserProfile | null> => {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.auth.admin.getUserById(userId);
  
  if (error || !data.user) return null;

  const metadata = await getUserMetadataById(userId);
  const appId = (metadata?.app_id as string) || TENANT_PUBLIC;
  const tenantId = (metadata?.tenant_id as string) || TENANT_PUBLIC;

  const roles = await getUserRolesList(userId, tenantId);
  const permissions = await getUserPermissions(userId, tenantId);

  return {
    user_id: data.user.id,
    email: data.user.email,
    phone: data.user.phone,
    name: metadata?.name as string,
    avatar_url: metadata?.avatar_url as string,
    app_id: appId,
    tenant_id: tenantId,
    roles,
    permissions,
    metadata: metadata || {},
    created_at: new Date(data.user.created_at),
    last_login_at: metadata?.last_login_at
      ? new Date(metadata.last_login_at as number)
      : undefined,
  };
};

// Update user profile
export const updateUserProfile = async (
  userId: string,
  data: UpdateUserProfileRequest
): Promise<UserProfile | null> => {
  const user = await getUserProfile(userId);
  if (!user) return null;

  const updates: Record<string, unknown> = { ...user.metadata };

  if (data.name !== undefined) updates.name = data.name;
  if (data.avatar_url !== undefined) updates.avatar_url = data.avatar_url;
  if (data.metadata) {
    Object.assign(updates, data.metadata);
  }

  // Update Supabase user metadata
  const supabase = getSupabaseAdminClient();
  await supabase.auth.admin.updateUserById(userId, {
    user_metadata: updates,
  });

  log.info(`Updated profile for user ${userId}`);

  return getUserProfile(userId);
};

// List users for a tenant
export const listUsers = async (
  tenantId: string,
  filter: UserListFilter = {},
  paginationToken?: string,
  limit: number = 20
): Promise<UserListResponse> => {
  const supabase = getSupabaseAdminClient();

  // Get users by tenant from user_metadata
  let query = db
    .select({ userId: userMetadata.userId })
    .from(userMetadata)
    .where(eq(userMetadata.tenantId, tenantId))
    .orderBy(userMetadata.userId)
    .limit(limit + 1);

  // Note: paginationToken filtering would need additional logic with Drizzle
  // For now, we'll handle it at the application level

  const metadataResults = await query;
  const hasMore = metadataResults.length > limit;
  const userMetadataList = hasMore ? metadataResults.slice(0, limit) : metadataResults;

  // Filter by pagination token
  let filteredList = userMetadataList;
  if (paginationToken) {
    filteredList = userMetadataList.filter(m => m.userId > paginationToken);
  }

  const users: UserListItem[] = [];

  for (const meta of filteredList) {
    const userId = meta.userId;

    // Get user from Supabase
    const { data: userData, error } = await supabase.auth.admin.getUserById(userId);
    if (error || !userData.user) continue;

    const userMeta = await getUserMetadataById(userId);
    const userTenantId = (userMeta?.tenant_id as string) || TENANT_PUBLIC;

    // Filter by tenant
    if (userTenantId !== tenantId && tenantId !== TENANT_PUBLIC) {
      continue;
    }

    const roles = await getUserRolesList(userId, tenantId);

    // Apply filters
    if (filter.role && !roles.includes(filter.role)) {
      continue;
    }

    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      const email = (userData.user.email || '').toLowerCase();
      const phone = (userData.user.phone || '').toLowerCase();
      const name = ((userMeta?.name as string) || '').toLowerCase();

      if (!email.includes(searchLower) && !phone.includes(searchLower) && !name.includes(searchLower)) {
        continue;
      }
    }

    const createdAt = new Date(userData.user.created_at);
    if (filter.created_after && createdAt < filter.created_after) {
      continue;
    }
    if (filter.created_before && createdAt > filter.created_before) {
      continue;
    }

    users.push({
      user_id: userData.user.id,
      email: userData.user.email,
      phone: userData.user.phone,
      name: userMeta?.name as string,
      roles,
      created_at: createdAt,
      last_login_at: userMeta?.last_login_at
        ? new Date(userMeta.last_login_at as number)
        : undefined,
    });
  }

  return {
    users,
    next_pagination_token: hasMore ? filteredList[filteredList.length - 1]?.userId : undefined,
  };
};

// Assign role to user
export const assignRole = async (
  tenantId: string,
  userId: string,
  role: string
): Promise<boolean> => {
  try {
    await addRoleToUser(tenantId, userId, role);
    log.info(`Assigned role ${role} to user ${userId}`);
    return true;
  } catch (error) {
    log.warn(`Failed to assign role ${role} to user ${userId}`, error);
    return false;
  }
};

// Remove role from user
export const removeRole = async (
  tenantId: string,
  userId: string,
  role: string
): Promise<boolean> => {
  try {
    await removeRoleFromUser(tenantId, userId, role);
    log.info(`Removed role ${role} from user ${userId}`);
    return true;
  } catch (error) {
    log.warn(`Failed to remove role ${role} from user ${userId}`, error);
    return false;
  }
};

// Bulk user actions
export const bulkAction = async (
  tenantId: string,
  request: BulkUserActionRequest
): Promise<BulkUserActionResponse> => {
  const result: BulkUserActionResponse = {
    success_count: 0,
    failed_count: 0,
    failed_user_ids: [],
    errors: [],
  };

  for (const userId of request.user_ids) {
    try {
      switch (request.action) {
        case 'assign_role':
          if (!request.role) {
            result.failed_count++;
            result.failed_user_ids.push(userId);
            result.errors.push(`Missing role for assign_role action`);
            continue;
          }
          await assignRole(tenantId, userId, request.role);
          break;

        case 'remove_role':
          if (!request.role) {
            result.failed_count++;
            result.failed_user_ids.push(userId);
            result.errors.push(`Missing role for remove_role action`);
            continue;
          }
          await removeRole(tenantId, userId, request.role);
          break;

        case 'delete':
          await deleteUser(userId);
          log.info(`Deleted user ${userId}`);
          break;

        default:
          result.failed_count++;
          result.failed_user_ids.push(userId);
          result.errors.push(`Unknown action: ${request.action}`);
          continue;
      }

      result.success_count++;
    } catch (error) {
      result.failed_count++;
      result.failed_user_ids.push(userId);
      result.errors.push((error as Error).message);
    }
  }

  return result;
};

// Update last login timestamp
export const updateLastLogin = async (userId: string): Promise<void> => {
  // Update updatedAt timestamp
  await db
    .update(userMetadata)
    .set({ updatedAt: new Date() })
    .where(eq(userMetadata.userId, userId));
};

// Delete user
export const deleteUser = async (userId: string): Promise<boolean> => {
  try {
    const supabase = getSupabaseAdminClient();
    const { error } = await supabase.auth.admin.deleteUser(userId);
    
    if (error) {
      throw new Error(error.message);
    }

    // Clean up user roles and metadata
    await db.delete(userRoles).where(eq(userRoles.userId, userId));
    await db.delete(userMetadata).where(eq(userMetadata.userId, userId));

    log.info(`Deleted user ${userId}`);
    return true;
  } catch (error) {
    log.error(`Failed to delete user ${userId}`, { error });
    return false;
  }
};
