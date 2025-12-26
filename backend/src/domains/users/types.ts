// User management types

export type UserProfile = {
  user_id: string;
  email?: string;
  phone?: string;
  name?: string;
  avatar_url?: string;
  app_id: string;
  tenant_id: string;
  roles: string[];
  permissions: string[];
  metadata: Record<string, unknown>;
  created_at: Date;
  last_login_at?: Date;
};

export type UserListItem = {
  user_id: string;
  email?: string;
  phone?: string;
  name?: string;
  roles: string[];
  created_at: Date;
  last_login_at?: Date;
};

export type UserListFilter = {
  search?: string;
  role?: string;
  created_after?: Date;
  created_before?: Date;
};

export type UserListResponse = {
  users: UserListItem[];
  next_pagination_token?: string;
  total?: number;
};

export type UpdateUserProfileRequest = {
  name?: string;
  avatar_url?: string;
  metadata?: Record<string, unknown>;
};

export type AssignRoleRequest = {
  user_id: string;
  role: string;
};

export type RemoveRoleRequest = {
  user_id: string;
  role: string;
};

export type BulkUserActionRequest = {
  user_ids: string[];
  action: 'assign_role' | 'remove_role' | 'delete';
  role?: string;
};

export type BulkUserActionResponse = {
  success_count: number;
  failed_count: number;
  failed_user_ids: string[];
  errors: string[];
};

