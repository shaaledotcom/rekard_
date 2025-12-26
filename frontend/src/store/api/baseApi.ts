import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../store";
import { config } from "@/lib/config";

// Base query with auth header injection
const baseQuery = fetchBaseQuery({
  baseUrl: config.apiUrl,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    // Add service type header for backend role assignment
    headers.set("X-Service", "producer");
    return headers;
  },
  credentials: "include",
});

// Tag types for cache invalidation
export const tagTypes = [
  "User",
  "Events",
  "Tickets",
  "Orders",
  "Billing",
  "Configuration",
  "Platform",
  "Currency",
] as const;

// API slice with RTK Query
export const api = createApi({
  reducerPath: "api",
  baseQuery,
  tagTypes,
  endpoints: () => ({}),
});

