// Tenant constants
export const TENANT_PUBLIC = 'public';

// App types
export const APP_TYPE_ADMIN = 'admin';
export const APP_TYPE_PRODUCER = 'producer';
export const APP_TYPE_VIEWER = 'viewer';

// Role names
export const ROLE_ADMIN = 'admin';
export const ROLE_PRODUCER = 'producer';
export const ROLE_VIEWER = 'viewer';
export const ROLE_MODERATOR = 'moderator';

// Role hierarchy (higher index = higher privileges)
export const ROLE_HIERARCHY = [ROLE_VIEWER, ROLE_MODERATOR, ROLE_PRODUCER, ROLE_ADMIN] as const;

// Special domains
export const LOCALHOST = 'localhost';
export const WATCH_REKARD_DOMAIN = 'watch.rekard.com';

// Default permissions for each role
export const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  [ROLE_ADMIN]: [
    'tickets:create', 'tickets:read', 'tickets:update', 'tickets:delete',
    'events:create', 'events:read', 'events:update', 'events:delete',
    'sales:create', 'sales:read', 'sales:update', 'sales:delete',
    'users:create', 'users:read', 'users:update', 'users:delete',
    'settings:create', 'settings:read', 'settings:update', 'settings:delete',
    'billing:create', 'billing:read', 'billing:update', 'billing:delete',
    'rolesandpermissions:create', 'rolesandpermissions:read',
    'rolesandpermissions:update', 'rolesandpermissions:delete',
    'tenant:manage', 'tenant:assign', 'app:manage',
  ],
  [ROLE_PRODUCER]: [
    'tickets:create', 'tickets:read', 'tickets:update', 'tickets:delete',
    'events:create', 'events:read', 'events:update', 'events:delete',
    'sales:create', 'sales:read', 'sales:update', 'sales:delete',
    'users:read', 'users:update',
    'settings:read', 'settings:update',
    'billing:read', 'billing:update',
    'rolesandpermissions:read',
  ],
  [ROLE_VIEWER]: [
    'tickets:read',
    'events:read',
    'sales:read',
    'users:read',
    'settings:read',
    'billing:read',
    'rolesandpermissions:read',
  ],
  [ROLE_MODERATOR]: [
    'tickets:read', 'tickets:update',
    'events:read', 'events:update',
    'sales:read',
    'users:read',
    'settings:read',
  ],
};

// Check if host is localhost or main domain
export const isLocalOrMainDomain = (host: string): boolean => {
  return (
    host === LOCALHOST ||
    host.includes(LOCALHOST) ||
    host === WATCH_REKARD_DOMAIN
  );
};

// Get highest role from a list of roles
export const getHighestRole = (roles: string[]): string | null => {
  let highestIndex = -1;
  let highestRole: string | null = null;

  for (const role of roles) {
    const index = ROLE_HIERARCHY.indexOf(role as typeof ROLE_HIERARCHY[number]);
    if (index > highestIndex) {
      highestIndex = index;
      highestRole = role;
    }
  }

  return highestRole;
};

