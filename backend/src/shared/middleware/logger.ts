import { Request, Response, NextFunction } from 'express';

// Format request log entry
const formatRequest = (req: Request): string => {
  const { method, originalUrl, ip } = req;
  const userAgent = req.get('user-agent') || '-';
  return `${method} ${originalUrl} - ${ip} - ${userAgent}`;
};

// Format response log entry
const formatResponse = (req: Request, res: Response, duration: number): string => {
  const { method, originalUrl } = req;
  const { statusCode } = res;
  return `${method} ${originalUrl} ${statusCode} - ${duration}ms`;
};

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();

  // Log incoming request
  console.log(`[REQ] ${formatRequest(req)}`);

  // Log response on finish
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const level = res.statusCode >= 400 ? 'ERR' : 'RES';
    console.log(`[${level}] ${formatResponse(req, res, duration)}`);
  });

  next();
};

// Simple console logger functions
export const log = {
  info: (message: string, data?: unknown): void => {
    console.log(`[INFO] ${message}`, data ?? '');
  },
  warn: (message: string, data?: unknown): void => {
    console.warn(`[WARN] ${message}`, data ?? '');
  },
  error: (message: string, error?: unknown): void => {
    console.error(`[ERROR] ${message}`, error ?? '');
  },
  debug: (message: string, data?: unknown): void => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEBUG] ${message}`, data ?? '');
    }
  },
};

