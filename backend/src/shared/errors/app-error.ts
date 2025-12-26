// Application error types
export type ErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'VALIDATION_ERROR'
  | 'INTERNAL_ERROR'
  | 'DATABASE_ERROR'
  | 'EXTERNAL_SERVICE_ERROR';

// Status codes for each error type
const statusCodes: Record<ErrorCode, number> = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  VALIDATION_ERROR: 422,
  INTERNAL_ERROR: 500,
  DATABASE_ERROR: 500,
  EXTERNAL_SERVICE_ERROR: 502,
};

// App error structure
export interface AppError {
  code: ErrorCode;
  message: string;
  statusCode: number;
  details?: Record<string, unknown>;
}

// Create an app error
export const createError = (
  code: ErrorCode,
  message: string,
  details?: Record<string, unknown>
): AppError => ({
  code,
  message,
  statusCode: statusCodes[code],
  details,
});

// Common error factories
export const badRequest = (message: string, details?: Record<string, unknown>): AppError =>
  createError('BAD_REQUEST', message, details);

export const unauthorized = (message = 'Unauthorized'): AppError =>
  createError('UNAUTHORIZED', message);

export const forbidden = (message = 'Forbidden'): AppError =>
  createError('FORBIDDEN', message);

export const notFound = (resource = 'Resource'): AppError =>
  createError('NOT_FOUND', `${resource} not found`);

export const conflict = (message: string): AppError =>
  createError('CONFLICT', message);

export const validationError = (message: string, details?: Record<string, unknown>): AppError =>
  createError('VALIDATION_ERROR', message, details);

export const internalError = (message = 'Internal server error'): AppError =>
  createError('INTERNAL_ERROR', message);

export const databaseError = (message = 'Database error'): AppError =>
  createError('DATABASE_ERROR', message);

// Check if error is an AppError
export const isAppError = (error: unknown): error is AppError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    'statusCode' in error
  );
};

