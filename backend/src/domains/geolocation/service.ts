import { log } from '../../shared/middleware/logger.js';
import type { ResolvedLocation, GeoblockingRule } from './types.js';
import { haversineDistanceKm, normalizeString } from './utils.js';

// ---------------------------------------------------------------------------
// In-memory TTL cache (IP -> ResolvedLocation)
// Geolocation service - IP resolution via ipapi.co + in-memory cache + rule matching
// ---------------------------------------------------------------------------

interface CacheEntry {
  data: ResolvedLocation;
  expires: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const CACHE_SWEEP_INTERVAL = 60 * 60 * 1000; // 1 hour

// Periodic sweep to prevent unbounded growth
let sweepTimer: ReturnType<typeof setInterval> | null = null;

function startCacheSweep(): void {
  if (sweepTimer) return;
  sweepTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of cache) {
      if (entry.expires <= now) {
        cache.delete(key);
      }
    }
  }, CACHE_SWEEP_INTERVAL);
  // Don't prevent Node.js from exiting
  if (sweepTimer && typeof sweepTimer === 'object' && 'unref' in sweepTimer) {
    sweepTimer.unref();
  }
}

startCacheSweep();

// ---------------------------------------------------------------------------
// IP Resolution
// ---------------------------------------------------------------------------

/**
 * Normalize the raw ipapi.co response into our ResolvedLocation shape.
 */
function normalizeResponse(data: Record<string, unknown>): ResolvedLocation {
  return {
    country_code: (data.country_code as string) || (data.country as string) || '',
    region: (data.region as string) || '',
    city: (data.city as string) || '',
    postal_code: (data.postal as string) || '',
    latitude: typeof data.latitude === 'number' ? data.latitude : 0,
    longitude: typeof data.longitude === 'number' ? data.longitude : 0,
  };
}

/**
 * Check whether an IP string looks like a private/local address that ipapi.co
 * cannot resolve. Returns true for loopback, link-local, and RFC-1918 ranges.
 */
function isPrivateIP(ip: string): boolean {
  if (!ip) return true;
  const cleaned = ip.replace(/^::ffff:/, '');
  return (
    cleaned === '127.0.0.1' ||
    cleaned === '::1' ||
    cleaned === 'localhost' ||
    cleaned.startsWith('10.') ||
    cleaned.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(cleaned)
  );
}

/**
 * Resolve an IP address to a geographic location using ipapi.co.
 * Returns null if the IP is private, the API is unavailable, or rate-limited.
 * Implements a 24-hour in-memory cache to minimize API calls.
 */
export async function resolveIP(ip: string): Promise<ResolvedLocation | null> {
  if (!ip || isPrivateIP(ip)) {
    return null;
  }

  // Check cache first
  const cached = cache.get(ip);
  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const response = await fetch(`https://ipapi.co/${ip}/json/`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      log.warn(`ipapi.co returned ${response.status} for IP ${ip}`);
      return null;
    }

    const data = await response.json() as Record<string, unknown>;

    // ipapi.co returns { error: true, reason: '...' } on failures
    if (data.error) {
      log.warn(`ipapi.co error for IP ${ip}: ${data.reason || 'unknown'}`);
      return null;
    }

    const resolved = normalizeResponse(data);

    // Cache the result
    cache.set(ip, { data: resolved, expires: Date.now() + CACHE_TTL });

    return resolved;
  } catch (err) {
    // Fail open -- don't block users if we can't determine location
    log.warn(`Failed to resolve IP ${ip}:`, err instanceof Error ? err.message : err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Geoblocking Rule Matching
// ---------------------------------------------------------------------------

/**
 * Check whether a resolved location matches a single geoblocking rule.
 */
function matchesRule(location: ResolvedLocation, rule: GeoblockingRule): boolean {
  switch (rule.type) {
    case 'country': {
      if (typeof rule.value !== 'string') return false;
      return normalizeString(location.country_code) === normalizeString(rule.value);
    }

    case 'state': {
      if (typeof rule.value !== 'string') return false;
      // If a country_code context is provided, require it to match first
      if (rule.country_code && normalizeString(location.country_code) !== normalizeString(rule.country_code)) {
        return false;
      }
      return normalizeString(location.region) === normalizeString(rule.value);
    }

    case 'city': {
      if (typeof rule.value !== 'string') return false;
      if (rule.country_code && normalizeString(location.country_code) !== normalizeString(rule.country_code)) {
        return false;
      }
      return normalizeString(location.city) === normalizeString(rule.value);
    }

    case 'pincode': {
      if (typeof rule.value !== 'string') return false;
      return normalizeString(location.postal_code) === normalizeString(rule.value);
    }

    case 'coordinates': {
      if (!Array.isArray(rule.value) || rule.value.length !== 2) return false;
      if (!rule.radius_km || rule.radius_km <= 0) return false;
      if (!location.latitude && !location.longitude) return false;

      const [ruleLat, ruleLng] = rule.value;
      const distance = haversineDistanceKm(
        location.latitude,
        location.longitude,
        ruleLat,
        ruleLng
      );
      return distance <= rule.radius_km;
    }

    default:
      return false;
  }
}

/**
 * Check whether a user's location is blocked by any of the geoblocking rules.
 *
 * - If geoblocking is disabled, returns false.
 * - If no rules are provided, returns false.
 * - If location is null (could not be resolved), returns false (fail open).
 * - Returns true if ANY rule matches (blocklist model).
 */
export function isLocationBlocked(
  geoblockingEnabled: boolean,
  rules: GeoblockingRule[] | null | undefined,
  location: ResolvedLocation | null
): boolean {
  if (!geoblockingEnabled) return false;
  if (!rules || rules.length === 0) return false;
  if (!location) return false; // Fail open

  return rules.some((rule) => matchesRule(location, rule));
}

/**
 * Get cache stats for monitoring/debugging.
 */
export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: cache.size,
    keys: Array.from(cache.keys()),
  };
}
