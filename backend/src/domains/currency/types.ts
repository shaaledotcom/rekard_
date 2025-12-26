// Currency domain types

export type Currency = {
  id: number;
  app_id: string;
  tenant_id: string;
  code: string;
  name: string;
  symbol?: string;
  is_active: boolean;
  is_default: boolean;
  created_at: Date;
  updated_at: Date;
};

export type CreateCurrencyRequest = {
  code: string;
  name: string;
  symbol?: string;
  is_active?: boolean;
  is_default?: boolean;
};

export type UpdateCurrencyRequest = {
  code?: string;
  name?: string;
  symbol?: string;
  is_active?: boolean;
  is_default?: boolean;
};

export type CurrencyFilter = {
  code?: string;
  search?: string;
  is_active?: boolean;
  is_default?: boolean;
};

export type CurrencyListResponse = {
  data: Currency[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

export type PaginationParams = {
  page?: number;
  page_size?: number;
};

