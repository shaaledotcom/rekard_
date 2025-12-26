import { Response, NextFunction } from 'express';
import { eq, and } from 'drizzle-orm';
import { db, roles, userRoles, rolePermissions } from '../../db/index';
import { unauthorized, forbidden } from '../../shared/utils/response.js';
import { log } from '../../shared/middleware/logger.js';
import { TENANT_PUBLIC } from './constants.js';
import type { AuthenticatedRequest } from './session.js';
import { getUserRoles, getUserPermissions } from './user.js';

// Get roles from request
const getRolesFromRequest = async (req: AuthenticatedRequest, tenantId?: string): Promise<string[]> => {
  const userId = req.userId;
  if (!userId) return [];

  try {
    return await getUserRoles(userId, tenantId);
  } catch {
    return [];
  }
};

// Get permissions from request
const getPermissionsFromRequest = async (req: AuthenticatedRequest, tenantId?: string): Promise<string[]> => {
  const userId = req.userId;
  if (!userId) return [];

  try {
    return await getUserPermissions(userId, tenantId);
  } catch {
    return [];
  }
};

// Check if user has specific role
const hasRole = (userRolesList: string[], requiredRole: string): boolean => {
  return userRolesList.includes(requiredRole);
};

// Check if user has any of the specified roles
const hasAnyRole = (userRolesList: string[], requiredRoles: string[]): boolean => {
  return requiredRoles.some((role) => userRolesList.includes(role));
};

// Check if user has specific permission
const hasPermission = (userPermissions: string[], requiredPermission: string): boolean => {
  return userPermissions.includes(requiredPermission);
};

// Check if user has any of the specified permissions
const hasAnyPermission = (userPermissions: string[], requiredPermissions: string[]): boolean => {
  return requiredPermissions.some((perm) => userPermissions.includes(perm));
};

// Middleware: Require specific role
export const requireRole = (role: string) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.userId;
    if (!userId) {
      unauthorized(res);
      return;
    }

    const tenantId = req.tenant?.tenantId;
    const rolesList = await getRolesFromRequest(req, tenantId);
    if (!hasRole(rolesList, role)) {
      log.warn(`Access denied: user ${userId} lacks role ${role}`);
      forbidden(res, `Required role: ${role}`);
      return;
    }

    next();
  };
};

// Middleware: Require any of specified roles
export const requireAnyRole = (...rolesRequired: string[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.userId;
    if (!userId) {
      unauthorized(res);
      return;
    }

    const tenantId = req.tenant?.tenantId;
    const userRolesList = await getRolesFromRequest(req, tenantId);
    if (!hasAnyRole(userRolesList, rolesRequired)) {
      log.warn(`Access denied: user ${userId} lacks any of roles ${rolesRequired.join(', ')}`);
      forbidden(res, `Required one of roles: ${rolesRequired.join(', ')}`);
      return;
    }

    next();
  };
};

// Middleware: Require specific permission
export const requirePermission = (permission: string) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.userId;
    if (!userId) {
      unauthorized(res);
      return;
    }

    const tenantId = req.tenant?.tenantId;
    const permissions = await getPermissionsFromRequest(req, tenantId);
    if (!hasPermission(permissions, permission)) {
      log.warn(`Access denied: user ${userId} lacks permission ${permission}`);
      forbidden(res, `Required permission: ${permission}`);
      return;
    }

    next();
  };
};

// Middleware: Require any of specified permissions
export const requireAnyPermission = (...permissionsRequired: string[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.userId;
    if (!userId) {
      unauthorized(res);
      return;
    }

    const tenantId = req.tenant?.tenantId;
    const userPermissions = await getPermissionsFromRequest(req, tenantId);
    if (!hasAnyPermission(userPermissions, permissionsRequired)) {
      log.warn(`Access denied: user ${userId} lacks any of permissions ${permissionsRequired.join(', ')}`);
      forbidden(res, `Required one of permissions: ${permissionsRequired.join(', ')}`);
      return;
    }

    next();
  };
};

// Add role to user
export const addRoleToUser = async (
  tenantId: string,
  userId: string,
  roleName: string
): Promise<void> => {
  const [roleRecord] = await db
    .select()
    .from(roles)
    .where(eq(roles.name, roleName))
    .limit(1);
  
  if (!roleRecord) {
    throw new Error(`Unknown role: ${roleName}`);
  }

  // Check if already exists
  const [existing] = await db
    .select()
    .from(userRoles)
    .where(
      and(
        eq(userRoles.userId, userId),
        eq(userRoles.roleId, roleRecord.id),
        eq(userRoles.tenantId, tenantId)
      )
    )
    .limit(1);

  if (!existing) {
    await db.insert(userRoles).values({
      userId,
      roleId: roleRecord.id,
      tenantId,
    });
  }
};

// Remove role from user
export const removeRoleFromUser = async (
  tenantId: string,
  userId: string,
  roleName: string
): Promise<void> => {
  const [roleRecord] = await db
    .select()
    .from(roles)
    .where(eq(roles.name, roleName))
    .limit(1);
  
  if (!roleRecord) {
    throw new Error(`Unknown role: ${roleName}`);
  }

  await db
    .delete(userRoles)
    .where(
      and(
        eq(userRoles.userId, userId),
        eq(userRoles.roleId, roleRecord.id),
        eq(userRoles.tenantId, tenantId)
      )
    );
};

// Get roles for user
export const getRolesForUser = async (
  tenantId: string = TENANT_PUBLIC,
  userId: string
): Promise<string[]> => {
  return getUserRoles(userId, tenantId);
};

// Get all roles
export const getAllRoles = async (): Promise<string[]> => {
  const allRoles = await db.select({ name: roles.name }).from(roles);
  return allRoles.map((r) => r.name);
};

// Get permissions for role
export const getPermissionsForRole = async (roleName: string): Promise<string[]> => {
  const [roleRecord] = await db
    .select()
    .from(roles)
    .where(eq(roles.name, roleName))
    .limit(1);
  
  if (!roleRecord) {
    throw new Error(`Unknown role: ${roleName}`);
  }

  const permissions = await db
    .select({ permission: rolePermissions.permission })
    .from(rolePermissions)
    .where(eq(rolePermissions.roleId, roleRecord.id));
  
  return permissions.map((p) => p.permission);
};

// Create role or add permissions
export const createRoleOrAddPermissions = async (
  roleName: string,
  permissions: string[]
): Promise<boolean> => {
  let [roleRecord] = await db
    .select()
    .from(roles)
    .where(eq(roles.name, roleName))
    .limit(1);

  let createdNewRole = false;

  if (!roleRecord) {
    const [newRole] = await db
      .insert(roles)
      .values({ name: roleName })
      .returning();
    roleRecord = newRole;
    createdNewRole = true;
  }

  // Add permissions
  if (permissions.length > 0) {
    const existingPerms = await db
      .select({ permission: rolePermissions.permission })
      .from(rolePermissions)
      .where(eq(rolePermissions.roleId, roleRecord.id));

    const existingPermNames = existingPerms.map((p) => p.permission);
    const missingPermissions = permissions.filter((p) => !existingPermNames.includes(p));

    if (missingPermissions.length > 0) {
      await db.insert(rolePermissions).values(
        missingPermissions.map((permission) => ({
          roleId: roleRecord.id,
          permission,
        }))
      );
    }
  }

  return createdNewRole;
};

// Delete role
export const deleteRole = async (roleName: string): Promise<void> => {
  const [roleRecord] = await db
    .select()
    .from(roles)
    .where(eq(roles.name, roleName))
    .limit(1);
  
  if (!roleRecord) {
    throw new Error(`Unknown role: ${roleName}`);
  }

  // Delete role permissions first (cascade should handle, but being explicit)
  await db.delete(rolePermissions).where(eq(rolePermissions.roleId, roleRecord.id));
  
  // Delete user roles
  await db.delete(userRoles).where(eq(userRoles.roleId, roleRecord.id));
  
  // Delete role
  await db.delete(roles).where(eq(roles.id, roleRecord.id));
};
