import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { eq } from 'drizzle-orm';
import { env } from '../../config/env.js';
import { log } from '../../shared/middleware/logger.js';
import { db, roles, userRoles, userMetadata, rolePermissions } from '../../db/index';
import { ROLE_PRODUCER, ROLE_VIEWER, ROLE_ADMIN, DEFAULT_ROLE_PERMISSIONS, SYSTEM_TENANT_ID, DEFAULT_APP_ID } from './constants.js';

// Domain owner provider (will be set from configuration service)
let domainOwnerProvider: ((host: string) => Promise<{ userId: string } | null>) | null = null;

export const setDomainOwnerProvider = (
  provider: (host: string) => Promise<{ userId: string } | null>
): void => {
  domainOwnerProvider = provider;
};

// Supabase clients
let supabaseClient: SupabaseClient | null = null;
let supabaseAdminClient: SupabaseClient | null = null;

// Initialize Supabase clients
export const initSupabase = async (): Promise<void> => {
  if (!env.supabase.url || !env.supabase.anonKey) {
    throw new Error('Supabase URL and anon key are required');
  }

  supabaseClient = createClient(env.supabase.url, env.supabase.anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: false, // We handle sessions manually
    },
  });

  if (env.supabase.serviceRoleKey) {
    supabaseAdminClient = createClient(env.supabase.url, env.supabase.serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  log.info('Supabase initialized');
};

// Get Supabase client (for regular operations)
export const getSupabaseClient = (): SupabaseClient => {
  if (!supabaseClient) {
    throw new Error('Supabase not initialized. Call initSupabase first.');
  }
  return supabaseClient;
};

// Get Supabase admin client (for admin operations)
export const getSupabaseAdminClient = (): SupabaseClient => {
  if (!supabaseAdminClient) {
    throw new Error('Supabase admin client not initialized. SUPABASE_SERVICE_ROLE_KEY is required.');
  }
  return supabaseAdminClient;
};

// Determine role based on service type
const getRoleForService = (service: string): string => {
  switch (service) {
    case 'producer':
      return ROLE_PRODUCER;
    case 'admin':
      return ROLE_ADMIN;
    case 'viewer':
    default:
      return ROLE_VIEWER;
  }
};

// Setup default roles with permissions
export const setupDefaultRoles = async (): Promise<void> => {
  try {
    for (const [roleName, permissions] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
      // Check if role exists
      const [existingRole] = await db
        .select()
        .from(roles)
        .where(eq(roles.name, roleName))
        .limit(1);

      if (!existingRole) {
        // Create role
        const [newRole] = await db
          .insert(roles)
          .values({ name: roleName })
          .returning();

        // Add permissions
        if (permissions.length > 0) {
          await db.insert(rolePermissions).values(
            permissions.map((permission) => ({
              roleId: newRole.id,
              permission,
            }))
          );
        }

        log.debug(`Role ${roleName} created with ${permissions.length} permissions`);
      } else {
        // Add any missing permissions
        const existingPerms = await db
          .select({ permission: rolePermissions.permission })
          .from(rolePermissions)
          .where(eq(rolePermissions.roleId, existingRole.id));

        const existingPermNames = existingPerms.map((p) => p.permission);
        const missingPermissions = permissions.filter((p) => !existingPermNames.includes(p));

        if (missingPermissions.length > 0) {
          await db.insert(rolePermissions).values(
            missingPermissions.map((permission) => ({
              roleId: existingRole.id,
              permission,
            }))
          );
          log.debug(`Added ${missingPermissions.length} permissions to role ${roleName}`);
        }
      }
    }

    log.info('Default roles configured');
  } catch (error) {
    log.error('Failed to setup default roles', error);
    throw error;
  }
};

// Assign default role to new user
export const assignDefaultRoleToUser = async (
  userId: string,
  service: string,
  xHost: string,
  appId: string = DEFAULT_APP_ID,
  tenantId: string = SYSTEM_TENANT_ID
): Promise<void> => {
  try {
    let tenantIdValue = tenantId;

    // For producers, tenant is themselves
    if (service === 'producer') {
      tenantIdValue = userId;
    }

    // For viewers, try to resolve from domain
    if (service === 'viewer' && xHost && domainOwnerProvider) {
      const domainOwner = await domainOwnerProvider(xHost);
      if (domainOwner) {
        tenantIdValue = domainOwner.userId;
        log.debug(`Domain owner found for ${xHost}: ${tenantIdValue}`);
      }
    }

    // Update user metadata - check if exists first
    const [existingMetadata] = await db
      .select()
      .from(userMetadata)
      .where(eq(userMetadata.userId, userId))
      .limit(1);

    if (existingMetadata) {
      await db
        .update(userMetadata)
        .set({
          appId,
          tenantId: tenantIdValue,
          updatedAt: new Date(),
        })
        .where(eq(userMetadata.userId, userId));
    } else {
      await db.insert(userMetadata).values({
        userId,
        appId,
        tenantId: tenantIdValue,
      });
    }

    // Assign role
    const roleName = getRoleForService(service);
    const [roleRecord] = await db
      .select()
      .from(roles)
      .where(eq(roles.name, roleName))
      .limit(1);

    if (roleRecord) {
      // Check if user already has this role for this tenant
      const [existingRole] = await db
        .select()
        .from(userRoles)
        .where(eq(userRoles.userId, userId))
        .limit(1);

      if (!existingRole) {
        await db.insert(userRoles).values({
          userId,
          roleId: roleRecord.id,
          tenantId: tenantIdValue,
        });
      }

      log.info(`Assigned role ${roleName} to user ${userId} with tenant ${tenantIdValue}`);
    }
  } catch (error) {
    log.error('Failed to assign default role to user', error);
    throw error;
  }
};
