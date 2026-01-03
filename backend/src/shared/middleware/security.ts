import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';

// Helmet security middleware with relaxed CSP for API
export const securityMiddleware = helmet({
  contentSecurityPolicy: false, // Disable for API
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: false, // Allow cross-origin requests
  crossOriginOpenerPolicy: false,
});

// Request timeout middleware
export const timeoutMiddleware = (timeoutMs: number, skipPaths?: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Skip timeout for specified paths
    if (skipPaths && skipPaths.some(path => req.path.startsWith(path))) {
      return next();
    }

    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        res.status(408).json({
          success: false,
          error: 'Request timeout',
        });
      }
    }, timeoutMs);

    res.on('finish', () => clearTimeout(timeout));
    res.on('close', () => clearTimeout(timeout));

    next();
  };
};

// Request ID middleware
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const requestId = req.headers['x-request-id'] as string || crypto.randomUUID();
  req.headers['x-request-id'] = requestId;
  res.setHeader('x-request-id', requestId);
  next();
};

