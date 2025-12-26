import { Response } from 'express';
import type { ApiResponse, ListResponse } from '../types/index.js';

// Build success response
export const success = <T>(data: T, message?: string): ApiResponse<T> => ({
  success: true,
  message,
  data,
});

// Build error response
export const error = (errorMessage: string): ApiResponse<never> => ({
  success: false,
  error: errorMessage,
});

// Build paginated list response
export const paginated = <T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number
): ListResponse<T> => ({
  data,
  total,
  page,
  pageSize,
  totalPages: Math.ceil(total / pageSize),
});

// Send JSON response with status code
export const sendJson = <T>(res: Response, statusCode: number, body: ApiResponse<T>): void => {
  res.status(statusCode).json(body);
};

// Convenience methods for common responses
export const ok = <T>(res: Response, data: T, message?: string): void => {
  sendJson(res, 200, success(data, message));
};

// For paginated list responses - flattens to { success, data: [...], total, page, ... }
export const okList = <T>(
  res: Response,
  listResponse: { data: T[]; total: number; page: number; page_size: number; total_pages: number },
  message?: string
): void => {
  res.status(200).json({
    success: true,
    message,
    data: listResponse.data,
    total: listResponse.total,
    page: listResponse.page,
    page_size: listResponse.page_size,
    total_pages: listResponse.total_pages,
  });
};

export const created = <T>(res: Response, data: T, message?: string): void => {
  sendJson(res, 201, success(data, message));
};

export const noContent = (res: Response): void => {
  res.status(204).send();
};

export const badRequest = (res: Response, message: string): void => {
  sendJson(res, 400, error(message));
};

export const unauthorized = (res: Response, message = 'Unauthorized'): void => {
  sendJson(res, 401, error(message));
};

export const forbidden = (res: Response, message = 'Forbidden'): void => {
  sendJson(res, 403, error(message));
};

export const notFound = (res: Response, message = 'Not found'): void => {
  sendJson(res, 404, error(message));
};

export const serverError = (res: Response, message = 'Internal server error'): void => {
  sendJson(res, 500, error(message));
};

