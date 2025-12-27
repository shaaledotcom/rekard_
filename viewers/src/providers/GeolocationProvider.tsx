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
        currency_name: data.currency_name || "US Dollar",
        ip: data.ip || "",
        city: data.city || "",
        region: data.region || "",
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
          currency_name: isIndiaTimezone ? "Indian Rupee" : "US Dollar",
          ip: "",
          city: "",
          region: "",
          timezone: timezone,
        };
        
        setGeolocation(fallbackData);
      } catch {
        // Final fallback
        setGeolocation({
          country_code: "US",
          country_name: "United States",
          currency: "USD",
          currency_name: "US Dollar",
          ip: "",
          city: "",
          region: "",
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

// Utility function for checking if a location is blocked
export function isLocationBlocked(
  geoblockingEnabled: boolean,
  geoblockingCountries: string[] | null | undefined,
  geolocation: GeolocationData | null
): boolean {
  if (!geoblockingEnabled || !geoblockingCountries || geoblockingCountries.length === 0) {
    return false;
  }

  if (!geolocation || !geolocation.country_code) {
    return false; // Don't block if we can't determine location
  }

  // Check if user's country is in the blocked list
  return geoblockingCountries.includes(geolocation.country_code);
}

