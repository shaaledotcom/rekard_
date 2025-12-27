import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../store";
import { config } from "@/lib/config";

// Base query with auth header injection and tenant context
const baseQuery = fetchBaseQuery({
  baseUrl: config.apiUrl,
  prepareHeaders: (headers, { getState }) => {
    const state = getState() as RootState;
    const token = state.auth.accessToken;

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    // Add service type header for backend role assignment
    headers.set("X-Service", "viewer");

    // Add current domain for tenant resolution
    if (typeof window !== "undefined") {
      headers.set("X-Host", window.location.host);
    }

    return headers;
  },
  credentials: "include",
});

// Tag types for cache invalidation
export const tagTypes = [
  "TenantConfig",
  "Dashboard",
  "Tickets",
  "Orders",
  "User",
  "Chat",
  "Streaming",
] as const;

// API slice with RTK Query
export const api = createApi({
  reducerPath: "api",
  baseQuery,
  tagTypes,
  endpoints: () => ({}),
});

