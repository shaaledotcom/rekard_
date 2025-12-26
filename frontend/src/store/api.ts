import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "./store";
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

// API slice with RTK Query
export const api = createApi({
  reducerPath: "api",
  baseQuery,
  tagTypes: [
    "User",
    "Events",
    "Tickets",
    "Orders",
    "Billing",
    "Configuration",
    "Platform",
    "Currency",
  ],
  endpoints: (builder) => ({
    // Protected routes
    getMe: builder.query<UserResponse, void>({
      query: () => "/v1/protected/me",
      providesTags: ["User"],
    }),
    getPreferences: builder.query<PreferencesResponse, void>({
      query: () => "/v1/protected/preferences",
    }),
    updatePreferences: builder.mutation<PreferencesResponse, UpdatePreferencesRequest>({
      query: (body) => ({
        url: "/v1/preferences",
        method: "PUT",
        body,
      }),
    }),

    // Health check
    healthCheck: builder.query<HealthResponse, void>({
      query: () => "/health",
    }),
  }),
});

// Types
export interface UserResponse {
  success: boolean;
  data: {
    id: string;
    email: string;
    phoneNumber: string;
    role: string;
    roles: string[];
    permissions: string[];
    app_id: string;
    tenant_ids: string[];
  };
  message: string;
}

export interface PreferencesResponse {
  success: boolean;
  data: {
    id: string;
    user_id: string;
    theme: string;
    language: string;
    timezone: string;
    notifications_enabled: boolean;
    created_at: string;
    updated_at: string;
  };
  message: string;
}

export interface UpdatePreferencesRequest {
  theme?: string;
  language?: string;
  timezone?: string;
  notifications_enabled?: boolean;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
}

// Export hooks
export const {
  useGetMeQuery,
  useGetPreferencesQuery,
  useUpdatePreferencesMutation,
  useHealthCheckQuery,
} = api;

