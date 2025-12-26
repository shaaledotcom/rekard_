import type { PaginationParams, SortParams } from '../types/index.js';

// Parse integer from string with default
export const parseIntOrDefault = (value: string | undefined, defaultValue: number): number => {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

// Parse float from string with default
export const parseFloatOrDefault = (value: string | undefined, defaultValue: number): number => {
  if (!value) return defaultValue;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
};

// Parse boolean from string
export const parseBool = (value: string | undefined): boolean => {
  return value === 'true' || value === '1';
};

// Parse optional boolean (returns undefined if not provided)
export const parseOptionalBool = (value: string | undefined): boolean | undefined => {
  if (value === undefined || value === '') return undefined;
  return value === 'true' || value === '1';
};

// Parse ID from path parameter
export const parseId = (value: string | undefined): number | null => {
  if (!value) return null;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) || parsed <= 0 ? null : parsed;
};

// Parse pagination from query params
export const parsePagination = (
  page: string | undefined,
  pageSize: string | undefined,
  defaults: PaginationParams = { page: 1, pageSize: 10 }
): PaginationParams => {
  const parsedPage = parseIntOrDefault(page, defaults.page);
  const parsedPageSize = parseIntOrDefault(pageSize, defaults.pageSize);

  return {
    page: Math.max(1, parsedPage),
    pageSize: Math.min(100, Math.max(1, parsedPageSize)),
  };
};

// Parse sort params from query
export const parseSort = (
  sortBy: string | undefined,
  sortOrder: string | undefined,
  defaults: SortParams = { sortBy: 'created_at', sortOrder: 'desc' }
): SortParams => {
  const order = sortOrder?.toLowerCase();
  return {
    sortBy: sortBy || defaults.sortBy,
    sortOrder: order === 'asc' || order === 'desc' ? order : defaults.sortOrder,
  };
};

// Parse RFC3339 time string
export const parseTime = (value: string | undefined): Date | null => {
  if (!value) return null;
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
};

// Parse comma-separated string to array
export const parseArray = (value: string | undefined): string[] => {
  if (!value) return [];
  return value.split(',').map((s) => s.trim()).filter(Boolean);
};

// Parse JSON safely
export const parseJson = <T>(value: string | undefined, defaultValue: T): T => {
  if (!value) return defaultValue;
  try {
    return JSON.parse(value) as T;
  } catch {
    return defaultValue;
  }
};

