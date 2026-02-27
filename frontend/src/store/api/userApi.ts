import { api } from "./baseApi";

// Types
export interface UserResponse {
  success: boolean;
  data: {
    id: string;
    name: string;
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

// User API endpoints
export const userApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Protected routes
    getMe: builder.query<UserResponse, void>({
      query: () => "/v1/protected/me",
      providesTags: ["User"],
    }),
    updateMe: builder.mutation<UserResponse, { name?: string; email?: string; phoneNumber?: string }>({
      query: (body) => ({
        url: "/v1/protected/me",
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["User"],
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

// Export hooks
export const {
  useGetMeQuery,
  useUpdateMeMutation,
  useGetPreferencesQuery,
  useUpdatePreferencesMutation,
  useHealthCheckQuery,
} = userApi;

