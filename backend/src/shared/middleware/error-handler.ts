import { Request, Response, NextFunction } from 'express';
import { isAppError } from '../errors/app-error.js';
import { error as errorResponse } from '../utils/response.js';
import { log } from './logger.js';

// Centralized error handling middleware
export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Handle known app errors
  if (isAppError(err)) {
    log.warn(`App error: ${err.code} - ${err.message}`);
    res.status(err.statusCode).json(errorResponse(err.message));
    return;
  }

  // Handle standard Error objects
  if (err instanceof Error) {
    log.error(`Unhandled error: ${err.message}`, err.stack);

    // Don't expose internal error details in production
    const message = process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message;

    res.status(500).json(errorResponse(message));
    return;
  }

  // Handle unknown error types
  log.error('Unknown error type', err);
  res.status(500).json(errorResponse('Internal server error'));
};

// Async handler wrapper to catch errors
export const asyncHandler = <T>(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<T>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Not found handler for unmatched routes
export const notFoundHandler = (_req: Request, res: Response): void => {
  res.status(404).json(errorResponse('Route not found'));
};

