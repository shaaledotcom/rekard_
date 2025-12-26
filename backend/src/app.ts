import express, { Express } from 'express';
import compression from 'compression';
import {
  corsMiddleware,
  securityMiddleware,
  requestIdMiddleware,
  requestLogger,
  timeoutMiddleware,
  errorHandler,
  notFoundHandler,
} from './shared/middleware/index.js';
import {
  optionalSession,
  refreshRolesMiddleware,
  tenantContextMiddleware,
} from './domains/auth/index.js';
import { routes } from './routes/index.js';

// Create and configure Express application
export const createApp = (): Express => {
  const app = express();

  // Trust proxy for correct IP detection
  app.set('trust proxy', true);

  // Request ID for tracing
  app.use(requestIdMiddleware);

  // CORS - must be before security middleware to handle preflight
  app.use(corsMiddleware);

  // Handle preflight requests explicitly
  app.options('*', corsMiddleware);

  // Security middleware
  app.use(securityMiddleware);

  // Request timeout (25 seconds)
  app.use(timeoutMiddleware(25000));

  // Compression
  app.use(compression());

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request logging
  app.use(requestLogger);

  // Optional session verification (sets req.userId if valid)
  app.use(optionalSession);

  // Refresh roles in session
  // app.use(refreshRolesMiddleware);

  // Tenant context extraction (uses session for user context)
  app.use(tenantContextMiddleware);

  // API routes (mounted at root, routes include /v1 prefix)
  app.use(routes);

  // 404 handler
  app.use(notFoundHandler);

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
};

