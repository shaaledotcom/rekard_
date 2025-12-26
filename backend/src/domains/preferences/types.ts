// User preferences domain types

export type UserPreference = {
  id: number;
  app_id: string;
  tenant_id: string;
  user_id: string;
  theme: string;
  language: string;
  timezone: string;
  notifications_enabled: boolean;
  created_at: Date;
  updated_at: Date;
};

export type CreateUserPreferenceRequest = {
  theme?: string;
  language?: string;
  timezone?: string;
  notifications_enabled?: boolean;
};

export type UpdateUserPreferenceRequest = {
  theme?: string;
  language?: string;
  timezone?: string;
  notifications_enabled?: boolean;
};

export type UserPreferenceFilter = {
  theme?: string;
  language?: string;
};

export type UserPreferenceListResponse = {
  data: UserPreference[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

export type PaginationParams = {
  page?: number;
  page_size?: number;
};

