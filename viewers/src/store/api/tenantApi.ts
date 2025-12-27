import { api } from "./baseApi";
import type { TenantConfig } from "../slices/tenantSlice";

// Wrapper type for API responses
interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export const tenantApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Get tenant configuration for current domain
    getTenantConfig: builder.query<TenantConfig, { domain?: string }>({
      query: ({ domain }) => ({
        url: "/v1/discover/platform/config",
        params: domain ? { domain } : undefined,
      }),
      transformResponse: (response: ApiResponse<TenantConfig>) => response.data,
      providesTags: ["TenantConfig"],
    }),
  }),
});

export const { useGetTenantConfigQuery } = tenantApi;

