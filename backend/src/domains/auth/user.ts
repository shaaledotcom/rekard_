import { eq, and, gt } from 'drizzle-orm';
import { getSupabaseAdminClient } from './supabase.js';
import { db, userMetadata, userRoles, roles, rolePermissions } from '../../db/index';
import { addRoleToUser } from './roles.js';
import { TENANT_PUBLIC, ROLE_VIEWER } from './constants.js';
import type { CreateUserRequest, CreateUserResponse, UserMetadata as UserMeta } from './types.js';
import { log } from '../../shared/middleware/logger.js';

// Get user by ID
export const getUserById = async (userId: string) => {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.auth.admin.getUserById(userId);
  
  if (error) {
    throw new Error(`Failed to get user: ${error.message}`);
  }
  
  return {
    id: data.user.id,
    emails: data.user.email ? [data.user.email] : [],
    phoneNumbers: data.user.phone ? [data.user.phone] : [],
  };
};

// Get user by email
export const getUserByEmail = async (_tenantId: string, email: string) => {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.auth.admin.listUsers();
  
  if (error) {
    throw new Error(`Failed to list users: ${error.message}`);
  }
  
  const user = data.users.find((u: { email?: string }) => u.email === email);
  if (!user) return null;

  return {
    id: user.id,
    emails: user.email ? [user.email] : [],
    phoneNumbers: user.phone ? [user.phone] : [],
  };
};

// Get user by phone
export const getUserByPhone = async (_tenantId: string, phone: string) => {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.auth.admin.listUsers();
  
  if (error) {
    throw new Error(`Failed to list users: ${error.message}`);
  }
  
  const user = data.users.find((u: { phone?: string }) => u.phone === phone);
  if (!user) return null;

  return {
    id: user.id,
    emails: user.email ? [user.email] : [],
    phoneNumbers: user.phone ? [user.phone] : [],
  };
};

// Get user metadata
export const getUserMetadataById = async (userId: string): Promise<UserMeta> => {
  const [metadata] = await db
    .select()
    .from(userMetadata)
    .where(eq(userMetadata.userId, userId))
    .limit(1);
  
  return {
    app_id: metadata?.appId || TENANT_PUBLIC,
    tenant_id: metadata?.tenantId || TENANT_PUBLIC,
  };
};

// Update user metadata
export const updateUserMetadata = async (
  userId: string,
  metadata: Partial<UserMeta>
): Promise<void> => {
  const [existing] = await db
    .select()
    .from(userMetadata)
    .where(eq(userMetadata.userId, userId))
    .limit(1);

  if (existing) {
    await db
      .update(userMetadata)
      .set({
        appId: metadata.app_id ?? existing.appId,
        tenantId: metadata.tenant_id ?? existing.tenantId,
        updatedAt: new Date(),
      })
      .where(eq(userMetadata.userId, userId));
  } else {
    await db.insert(userMetadata).values({
      userId,
      appId: metadata.app_id || TENANT_PUBLIC,
      tenantId: metadata.tenant_id || TENANT_PUBLIC,
    });
  }
};

// Get user metadata (appId and tenantId)
export const getUserMetadata = async (
  userId: string
): Promise<{ appId: string; tenantId: string }> => {
  try {
    const metadata = await getUserMetadataById(userId);
    return {
      appId: (metadata?.app_id as string) || TENANT_PUBLIC,
      tenantId: (metadata?.tenant_id as string) || TENANT_PUBLIC,
    };
  } catch {
    return { appId: TENANT_PUBLIC, tenantId: TENANT_PUBLIC };
  }
};

// Create user (for purchase without login flow)
export const createUser = async (
  request: CreateUserRequest
): Promise<CreateUserResponse> => {
  const { email, phone, appId, tenantId, role } = request;

  if (!email && !phone) {
    throw new Error('Either email or phone is required');
  }

  let user;
  let createdNewUser = false;

  // Try to find existing user
  if (email) {
    user = await getUserByEmail(TENANT_PUBLIC, email);
  } else if (phone) {
    user = await getUserByPhone(TENANT_PUBLIC, phone);
  }

  // Create new user if not found
  if (!user) {
    const supabase = getSupabaseAdminClient();
    
    // Create user with Supabase Admin API
    const { data: newUser, error } = await supabase.auth.admin.createUser({
      email: email,
      phone: phone,
      email_confirm: true, // Auto-confirm email
      phone_confirm: true, // Auto-confirm phone
    });

    if (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }

    user = {
      id: newUser.user.id,
      emails: newUser.user.email ? [newUser.user.email] : [],
      phoneNumbers: newUser.user.phone ? [newUser.user.phone] : [],
    };
    createdNewUser = true;

    // Set metadata and role for new user
    if (createdNewUser) {
      await updateUserMetadata(user.id, {
        app_id: appId,
        tenant_id: tenantId,
      });

      await addRoleToUser(TENANT_PUBLIC, user.id, role || ROLE_VIEWER);
      log.info(`Created new user ${user.id} with role ${role}`);
    }
  }

  return {
    userId: user!.id,
    email: user!.emails?.[0],
    phone: user!.phoneNumbers?.[0],
    createdNewUser,
  };
};

// Change user tenant
export const changeUserTenant = async (
  userId: string,
  tenantId: string
): Promise<void> => {
  await updateUserMetadata(userId, { tenant_id: tenantId });
};

// Change user app
export const changeUserApp = async (
  userId: string,
  appId: string
): Promise<void> => {
  await updateUserMetadata(userId, { app_id: appId });
};

// Get user tenant and app
export const getUserTenantAndApp = async (
  userId: string
): Promise<{ tenantId: string; appId: string }> => {
  const metadata = await getUserMetadataById(userId);
  return {
    tenantId: (metadata?.tenant_id as string) || TENANT_PUBLIC,
    appId: (metadata?.app_id as string) || TENANT_PUBLIC,
  };
};

// Get users by metadata (for finding viewers by producer)
export const getUsersByMetadata = async (
  _appId: string,
  tenantId: string,
  paginationToken?: string,
  limit?: number
): Promise<{
  users: Array<{ user: Record<string, unknown> }>;
  nextPaginationToken?: string;
}> => {
  const whereConditions = paginationToken
    ? and(eq(userMetadata.tenantId, tenantId), gt(userMetadata.userId, paginationToken))
    : eq(userMetadata.tenantId, tenantId);

  const effectiveLimit = limit ? limit + 1 : undefined;

  const query = db
    .select({ userId: userMetadata.userId })
    .from(userMetadata)
    .where(whereConditions)
    .orderBy(userMetadata.userId)
    .limit(effectiveLimit ?? Number.MAX_SAFE_INTEGER);

  const results = await query;
  const hasMore = limit && results.length > limit;
  const users = hasMore ? results.slice(0, limit) : results;

  return {
    users: users.map((row) => ({ user: { id: row.userId } })),
    nextPaginationToken: hasMore ? users[users.length - 1].userId : undefined,
  };
};

// Get user roles
export const getUserRoles = async (userId: string, tenantId?: string): Promise<string[]> => {
  const conditions = [eq(userRoles.userId, userId)];
  if (tenantId) {
    conditions.push(eq(userRoles.tenantId, tenantId));
  }

  const result = await db
    .select({ name: roles.name })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(and(...conditions));

  return result.map((r) => r.name);
};

// Get user permissions
export const getUserPermissions = async (userId: string, tenantId?: string): Promise<string[]> => {
  const conditions = [eq(userRoles.userId, userId)];
  if (tenantId) {
    conditions.push(eq(userRoles.tenantId, tenantId));
  }

  const result = await db
    .selectDistinct({ permission: rolePermissions.permission })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .innerJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
    .where(and(...conditions));

  return result.map((p) => p.permission);
};
