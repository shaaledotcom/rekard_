// Check if value is non-empty string
export const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === 'string' && value.trim().length > 0;
};

// Check if value is positive integer
export const isPositiveInt = (value: unknown): value is number => {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
};

// Check if value is non-negative number
export const isNonNegativeNumber = (value: unknown): value is number => {
  return typeof value === 'number' && !isNaN(value) && value >= 0;
};

// Check if value is valid email
export const isValidEmail = (value: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
};

// Check if array has items
export const hasItems = <T>(arr: unknown): arr is T[] => {
  return Array.isArray(arr) && arr.length > 0;
};

// Validate required fields in object
export const validateRequired = (
  obj: Record<string, unknown>,
  fields: string[]
): { valid: boolean; missing: string[] } => {
  const missing = fields.filter((field) => {
    const value = obj[field];
    return value === undefined || value === null || value === '';
  });

  return { valid: missing.length === 0, missing };
};

// Validate ID (must be positive integer)
export const validateId = (id: unknown): { valid: boolean; value: number } => {
  if (typeof id === 'string') {
    const parsed = parseInt(id, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return { valid: true, value: parsed };
    }
  }
  if (typeof id === 'number' && Number.isInteger(id) && id > 0) {
    return { valid: true, value: id };
  }
  return { valid: false, value: 0 };
};

// Sanitize string (trim and limit length)
export const sanitizeString = (value: string, maxLength = 1000): string => {
  return value.trim().slice(0, maxLength);
};

// Validate pagination bounds
export const validatePagination = (
  page: number,
  pageSize: number
): { page: number; pageSize: number } => ({
  page: Math.max(1, page),
  pageSize: Math.min(100, Math.max(1, pageSize)),
});

