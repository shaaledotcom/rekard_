"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

export interface GeolocationData {
  country_code: string;
  country_name: string;
  currency: string;
  currency_name: string;
  ip: string;
  city: string;
  region: string;
  postal_code: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

interface GeolocationContextType {
  geolocation: GeolocationData | null;
  isLoading: boolean;
  error: string | null;
  refreshGeolocation: () => void;
  isIndia: boolean;
  userCurrency: string;
}

const GeolocationContext = createContext<GeolocationContextType | undefined>(undefined);

const GEOLOCATION_CACHE_KEY = "rekard_geolocation_cache";
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Default conversion rate (will be overridden by actual API data)
const DEFAULT_USD_TO_INR_RATE = 83;

export function GeolocationProvider({ children }: { children: React.ReactNode }) {
  const [geolocation, setGeolocation] = useState<GeolocationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getCachedGeolocation = useCallback((): GeolocationData | null => {
    if (typeof window === "undefined") return null;
    
    try {
      const cached = localStorage.getItem(GEOLOCATION_CACHE_KEY);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      const now = Date.now();

      if (now - timestamp < CACHE_DURATION) {
        return data;
      }

      localStorage.removeItem(GEOLOCATION_CACHE_KEY);
      return null;
    } catch {
      return null;
    }
  }, []);

  const setCachedGeolocation = useCallback((data: GeolocationData) => {
    if (typeof window === "undefined") return;
    
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
      };
      localStorage.setItem(GEOLOCATION_CACHE_KEY, JSON.stringify(cacheData));
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const fetchGeolocation = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Try ipapi.co first
      const response = await fetch("https://ipapi.co/json/", {
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch geolocation data");
      }

      const data = await response.json();
      
      // Normalize the response
      const normalizedData: GeolocationData = {
        country_code: data.country_code || data.country || "",
        country_name: data.country_name || "",
        currency: data.currency || "USD",
        currency_name: data.currency_name ? data.currency_name.replace(/US Dollar/g, "Dollar") : "Dollar",
        ip: data.ip || "",
        city: data.city || "",
        region: data.region || "",
        postal_code: data.postal || "",
        latitude: typeof data.latitude === "number" ? data.latitude : 0,
        longitude: typeof data.longitude === "number" ? data.longitude : 0,
        timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      };

      setGeolocation(normalizedData);
      setCachedGeolocation(normalizedData);
    } catch (err) {
      console.error("Geolocation fetch error:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      
      // Fallback: Try to detect timezone and make educated guess
      try {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const isIndiaTimezone = timezone.includes("Kolkata") || timezone.includes("Calcutta");
        
        const fallbackData: GeolocationData = {
          country_code: isIndiaTimezone ? "IN" : "US",
          country_name: isIndiaTimezone ? "India" : "United States",
          currency: isIndiaTimezone ? "INR" : "USD",
          currency_name: isIndiaTimezone ? "Indian Rupee" : "Dollar",
          ip: "",
          city: "",
          region: "",
          postal_code: "",
          latitude: 0,
          longitude: 0,
          timezone: timezone,
        };
        
        setGeolocation(fallbackData);
      } catch {
        // Final fallback
        setGeolocation({
          country_code: "US",
          country_name: "United States",
          currency: "USD",
          currency_name: "Dollar",
          ip: "",
          city: "",
          region: "",
          postal_code: "",
          latitude: 0,
          longitude: 0,
          timezone: "America/New_York",
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [setCachedGeolocation]);

  const refreshGeolocation = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(GEOLOCATION_CACHE_KEY);
    }
    fetchGeolocation();
  }, [fetchGeolocation]);

  useEffect(() => {
    const cached = getCachedGeolocation();
    if (cached) {
      setGeolocation(cached);
      setIsLoading(false);
    } else {
      fetchGeolocation();
    }
  }, [getCachedGeolocation, fetchGeolocation]);

  const isIndia = geolocation?.country_code === "IN";
  const userCurrency = geolocation?.currency || "USD";

  return (
    <GeolocationContext.Provider
      value={{
        geolocation,
        isLoading,
        error,
        refreshGeolocation,
        isIndia,
        userCurrency,
      }}
    >
      {children}
    </GeolocationContext.Provider>
  );
}

export function useGeolocation() {
  const context = useContext(GeolocationContext);
  if (context === undefined) {
    throw new Error("useGeolocation must be used within a GeolocationProvider");
  }
  return context;
}

// ---------------------------------------------------------------------------
// Geoblocking rule types (mirrors backend GeoblockingRule)
// ---------------------------------------------------------------------------

export interface GeoblockingRule {
  type: "country" | "city" | "state" | "pincode" | "coordinates";
  value: string | [number, number];
  country_code?: string;
  radius_km?: number;
  name?: string;
}

// ---------------------------------------------------------------------------
// Haversine distance (km)
// ---------------------------------------------------------------------------

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

function haversineDistanceKm(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ---------------------------------------------------------------------------
// Rule matching
// ---------------------------------------------------------------------------

function normalize(str: string): string {
  return str.trim().toLowerCase();
}

function matchesRule(geo: GeolocationData, rule: GeoblockingRule): boolean {
  switch (rule.type) {
    case "country":
      return typeof rule.value === "string" &&
        normalize(geo.country_code) === normalize(rule.value);

    case "state":
      if (typeof rule.value !== "string") return false;
      if (rule.country_code && normalize(geo.country_code) !== normalize(rule.country_code)) return false;
      return normalize(geo.region) === normalize(rule.value);

    case "city":
      if (typeof rule.value !== "string") return false;
      if (rule.country_code && normalize(geo.country_code) !== normalize(rule.country_code)) return false;
      return normalize(geo.city) === normalize(rule.value);

    case "pincode":
      return typeof rule.value === "string" &&
        normalize(geo.postal_code) === normalize(rule.value);

    case "coordinates": {
      if (!Array.isArray(rule.value) || rule.value.length !== 2) return false;
      if (!rule.radius_km || rule.radius_km <= 0) return false;
      if (!geo.latitude && !geo.longitude) return false;
      const [ruleLat, ruleLng] = rule.value;
      return haversineDistanceKm(geo.latitude, geo.longitude, ruleLat, ruleLng) <= rule.radius_km;
    }

    default:
      return false;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Check whether the user's location is blocked by any of the geoblocking rules.
 * Blocklist model: if ANY rule matches, the user is blocked.
 * Fails open (returns false) when location cannot be determined.
 */
export function isLocationBlocked(
  geoblockingEnabled: boolean,
  rules: GeoblockingRule[] | null | undefined,
  geolocation: GeolocationData | null
): boolean {
  if (!geoblockingEnabled) return false;
  if (!rules || rules.length === 0) return false;
  if (!geolocation || !geolocation.country_code) return false;

  return rules.some((rule) => matchesRule(geolocation, rule));
}

