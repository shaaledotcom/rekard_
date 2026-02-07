// Geolocation middleware - resolves request IP to geographic location
import type { Request, Response, NextFunction } from 'express';
import { resolveIP } from '../../domains/geolocation/index.js';
import type { ResolvedLocation } from '../../domains/geolocation/index.js';

// Extend Express Request to carry geolocation data
declare global {
  namespace Express {
    interface Request {
      geolocation?: ResolvedLocation | null;
    }
  }
}

/**
 * Extract the client IP from the request.
 * Handles X-Forwarded-For header (comma-separated list) and falls back to req.ip.
 */
function extractClientIP(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    // X-Forwarded-For can be comma-separated; first entry is the real client
    return forwarded.split(',')[0].trim();
  }
  return req.ip || '';
}

/**
 * Middleware that resolves the client's IP to a geographic location
 * and attaches it to `req.geolocation`.
 *
 * Apply this only to routes that need geolocation data (viewer routes)
 * to avoid unnecessary API calls on producer/admin routes.
 *
 * If resolution fails the field is set to null (fail open).
 */
export async function geolocationMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const ip = extractClientIP(req);
    req.geolocation = await resolveIP(ip);
  } catch {
    // Never block the request pipeline due to geolocation errors
    req.geolocation = null;
  }
  next();
}
