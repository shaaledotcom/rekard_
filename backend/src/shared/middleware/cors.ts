import cors from 'cors';
import { env } from '../../config/env.js';

// Always allow localhost regardless of config (any port)
const isLocalhost = (origin: string): boolean => {
  try {
    const url = new URL(origin);
    return (
      url.hostname === 'localhost' ||
      url.hostname === '127.0.0.1' ||
      url.hostname === '0.0.0.0' ||
      url.hostname.endsWith('.localhost')
    );
  } catch {
    return false;
  }
};

// Build CORS options from environment
export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) {
      callback(null, true);
      return;
    }

    // Always allow localhost (any port)
    if (isLocalhost(origin)) {
      callback(null, origin);
      return;
    }

    // Check against allowed origins
    const allowed = env.cors.allowedOrigins.some((allowedOrigin) => {
      // Exact match
      if (allowedOrigin === origin) return true;

      // Wildcard subdomain match (e.g., *.rekard.com)
      if (allowedOrigin.startsWith('*.')) {
        const domain = allowedOrigin.slice(2);
        return origin.endsWith(domain);
      }

      return false;
    });

    if (allowed) {
      callback(null, origin);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(null, false);
    }
  },
  credentials: env.cors.allowCredentials,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Accept',
    'Authorization',
    'Content-Type',
    'X-CSRF-Token',
    'X-Requested-With',
    'X-Organization-Id',
    'X-Host',
    'X-Service',
  ],
  exposedHeaders: ['Authorization', 'X-Organization-Id'],
  maxAge: env.cors.maxAge,
});

