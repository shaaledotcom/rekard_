// Session with user info
export interface AuthSession {
  userId: string;
  roles: string[];
  permissions: string[];
}

// User metadata stored in SuperTokens
export interface UserMetadata {
  app_id?: string;
  tenant_id?: string;
  [key: string]: unknown;
}

// Domain owner from configuration
export interface DomainOwner {
  userId: string;
  appId: string;
  tenantId: string;
  domain: string;
}

// Tenant context for request
export interface TenantContext {
  userId: string;
  appId: string;
  tenantId: string;
  fromDomain: boolean;
}

// Role with permissions
export interface RolePermission {
  role: string;
  permissions: string[];
}

// User roles response
export interface UserRolesResponse {
  userId: string;
  roles: string[];
}

// User creation request
export interface CreateUserRequest {
  email?: string;
  phone?: string;
  name?: string;
  appId: string;
  tenantId: string;
  role: string;
}

// User creation response
export interface CreateUserResponse {
  userId: string;
  email?: string;
  phone?: string;
  createdNewUser: boolean;
}

// Domain owner provider function type
export type DomainOwnerProvider = (host: string) => Promise<DomainOwner | null>;

// User context provider function type
export type UserContextProvider = (
  userId: string
) => Promise<{ appId: string; tenantId: string }>;

