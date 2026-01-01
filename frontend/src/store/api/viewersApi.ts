import { api } from "./baseApi";

// Types
export type ViewerAccessStatus = "active" | "expired" | "revoked" | "used";

export interface ViewerAccess {
  id: number;
  app_id: string;
  tenant_id: string;
  user_id: string;
  ticket_id: number;
  email: string;
  status: ViewerAccessStatus;
  granted_at: string;
  expires_at?: string;
  used_at?: string;
  ticket_title?: string;
  viewer_name?: string;
  viewer_user_id?: string;
  has_signed_up: boolean;
}

export interface ViewerMapping {
  id: string;
  viewer_user_id: string;
  tenant_id: string;
  source: string;
  first_order_id?: number;
  status: string;
  created_at: string;
}

export interface ViewerAccessListResponse {
  data: ViewerAccess[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ViewerMappingListResponse {
  data: ViewerMapping[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ViewerAccessQueryParams {
  page?: number;
  page_size?: number;
  ticket_id?: number;
  email?: string;
  status?: ViewerAccessStatus;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

export interface GrantAccessRequest {
  emails: string[];
  ticket_id?: number; // For backward compatibility
  ticket_ids?: number[]; // New: support multiple tickets
  expires_at?: string;
  notify?: boolean;
}

export interface GrantAccessResult {
  success: string[];
  failed: { email: string; reason: string }[];
  total_granted: number;
  total_failed: number;
}

export interface BulkImportRequest {
  csv_data: string;
  ticket_id: number;
  expires_at?: string;
  notify?: boolean;
}

export interface CSVParseResult {
  valid: { email: string; name?: string }[];
  invalid: { row: number; data: string; reason: string }[];
}

export interface BulkImportResult {
  parse_result: CSVParseResult;
  grant_result: GrantAccessResult;
}

export interface ValidateCSVResult {
  valid_count: number;
  invalid_count: number;
  valid: { email: string; name?: string }[];
  invalid: { row: number; data: string; reason: string }[];
}

export interface AccessStats {
  total_grants: number;
  active_grants: number;
  used_grants: number;
  expired_grants: number;
  revoked_grants: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Viewers API slice
export const viewersApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // List access grants
    getViewerAccess: builder.query<ViewerAccessListResponse, ViewerAccessQueryParams>({
      query: (params) => ({
        url: "/v1/producer/viewers/access",
        params,
      }),
      transformResponse: (response: ApiResponse<ViewerAccessListResponse>) => response.data,
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: "ViewerAccess" as const, id })),
              { type: "ViewerAccess", id: "LIST" },
            ]
          : [{ type: "ViewerAccess", id: "LIST" }],
    }),

    // Get single access grant
    getViewerAccessById: builder.query<ViewerAccess, number>({
      query: (id) => `/v1/producer/viewers/access/${id}`,
      transformResponse: (response: ApiResponse<ViewerAccess>) => response.data,
      providesTags: (result, error, id) => [{ type: "ViewerAccess", id }],
    }),

    // Grant access
    grantAccess: builder.mutation<GrantAccessResult, GrantAccessRequest>({
      query: (body) => ({
        url: "/v1/producer/viewers/access/grant",
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiResponse<GrantAccessResult>) => response.data,
      invalidatesTags: [{ type: "ViewerAccess", id: "LIST" }],
    }),

    // Bulk import from CSV
    bulkImportAccess: builder.mutation<BulkImportResult, BulkImportRequest>({
      query: (body) => ({
        url: "/v1/producer/viewers/access/import",
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiResponse<BulkImportResult>) => response.data,
      invalidatesTags: [{ type: "ViewerAccess", id: "LIST" }],
    }),

    // Validate CSV
    validateCSV: builder.mutation<ValidateCSVResult, { csv_data: string }>({
      query: (body) => ({
        url: "/v1/producer/viewers/access/validate-csv",
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiResponse<ValidateCSVResult>) => response.data,
    }),

    // Revoke access
    revokeAccess: builder.mutation<{ id: number; revoked: boolean }, number>({
      query: (id) => ({
        url: `/v1/producer/viewers/access/${id}/revoke`,
        method: "POST",
      }),
      transformResponse: (response: ApiResponse<{ id: number; revoked: boolean }>) => response.data,
      invalidatesTags: (result, error, id) => [
        { type: "ViewerAccess", id },
        { type: "ViewerAccess", id: "LIST" },
      ],
    }),

    // Delete access
    deleteAccess: builder.mutation<{ id: number; deleted: boolean }, number>({
      query: (id) => ({
        url: `/v1/producer/viewers/access/${id}`,
        method: "DELETE",
      }),
      transformResponse: (response: ApiResponse<{ id: number; deleted: boolean }>) => response.data,
      invalidatesTags: (result, error, id) => [
        { type: "ViewerAccess", id },
        { type: "ViewerAccess", id: "LIST" },
      ],
    }),

    // Get access for specific ticket
    getTicketAccess: builder.query<{ data: ViewerAccess[]; total: number }, number>({
      query: (ticketId) => `/v1/producer/viewers/tickets/${ticketId}/access`,
      transformResponse: (response: ApiResponse<{ data: ViewerAccess[]; total: number }>) => response.data,
      providesTags: (result, error, ticketId) => [
        { type: "ViewerAccess", id: `TICKET_${ticketId}` },
      ],
    }),

    // List viewers (tenant mappings)
    getViewers: builder.query<ViewerMappingListResponse, { page?: number; page_size?: number }>({
      query: (params) => ({
        url: "/v1/producer/viewers",
        params,
      }),
      transformResponse: (response: ApiResponse<ViewerMappingListResponse>) => response.data,
      providesTags: [{ type: "Viewers", id: "LIST" }],
    }),

    // Get access stats
    getAccessStats: builder.query<AccessStats, void>({
      query: () => "/v1/producer/viewers/stats",
      transformResponse: (response: ApiResponse<AccessStats>) => response.data,
      providesTags: [{ type: "ViewerAccess", id: "STATS" }],
    }),
  }),
});

// Export hooks
export const {
  useGetViewerAccessQuery,
  useGetViewerAccessByIdQuery,
  useGrantAccessMutation,
  useBulkImportAccessMutation,
  useValidateCSVMutation,
  useRevokeAccessMutation,
  useDeleteAccessMutation,
  useGetTicketAccessQuery,
  useGetViewersQuery,
  useGetAccessStatsQuery,
} = viewersApi;

