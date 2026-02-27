import { api } from "./baseApi";

export interface MeResponse {
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

export const userApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getMe: builder.query<MeResponse["data"], void>({
      query: () => "/v1/protected/me",
      transformResponse: (response: MeResponse) => response.data,
      providesTags: ["User"],
    }),
    updateMe: builder.mutation<MeResponse["data"], { name?: string; email?: string; phoneNumber?: string }>({
      query: (body) => ({
        url: "/v1/protected/me",
        method: "PATCH",
        body,
      }),
      transformResponse: (response: MeResponse) => response.data,
      invalidatesTags: ["User"],
    }),
  }),
});

export const { useGetMeQuery, useUpdateMeMutation } = userApi;
