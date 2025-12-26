import { api } from "./baseApi";

// Configuration types for Pro features

export interface PaymentGatewaySettings {
  id?: number;
  key: string;
  secret: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface DomainSettings {
  id?: number;
  domain: string;
  subdomain?: string;
  is_verified?: boolean;
  ssl_enabled?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PaymentReceiverSettings {
  id?: number;
  account_holder_name: string;
  account_number: string;
  ifsc_code: string;
  pan: string;
  gstin: string;
  upi_phone_number: string;
  upi_id: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SmsGatewaySettings {
  id?: number;
  provider: string;
  api_key: string;
  sender_id: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface EmailGatewaySettings {
  id?: number;
  provider: string;
  api_key: string;
  from_email: string;
  from_name: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface ConfigurationResponse<T> {
  success: boolean;
  data: T | null;
  message?: string;
}

// Configuration API endpoints
export const configurationApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Payment Gateway
    getPaymentGatewaySettings: builder.query<ConfigurationResponse<PaymentGatewaySettings>, void>({
      query: () => "/v1/producer/configuration/payment-gateway",
      providesTags: ["Configuration"],
    }),
    createPaymentGatewaySettings: builder.mutation<ConfigurationResponse<PaymentGatewaySettings>, Omit<PaymentGatewaySettings, "id" | "created_at" | "updated_at">>({
      query: (body) => ({
        url: "/v1/producer/configuration/payment-gateway",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Configuration"],
    }),
    updatePaymentGatewaySettings: builder.mutation<ConfigurationResponse<PaymentGatewaySettings>, Omit<PaymentGatewaySettings, "id" | "created_at" | "updated_at">>({
      query: (body) => ({
        url: "/v1/producer/configuration/payment-gateway",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Configuration"],
    }),
    deletePaymentGatewaySettings: builder.mutation<{ success: boolean }, void>({
      query: () => ({
        url: "/v1/producer/configuration/payment-gateway",
        method: "DELETE",
      }),
      invalidatesTags: ["Configuration"],
    }),

    // Domain Settings
    getDomainSettings: builder.query<ConfigurationResponse<DomainSettings>, void>({
      query: () => "/v1/producer/configuration/domain",
      providesTags: ["Configuration"],
    }),
    createDomainSettings: builder.mutation<ConfigurationResponse<DomainSettings>, Omit<DomainSettings, "id" | "created_at" | "updated_at">>({
      query: (body) => ({
        url: "/v1/producer/configuration/domain",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Configuration"],
    }),
    updateDomainSettings: builder.mutation<ConfigurationResponse<DomainSettings>, Omit<DomainSettings, "id" | "created_at" | "updated_at">>({
      query: (body) => ({
        url: "/v1/producer/configuration/domain",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Configuration"],
    }),
    deleteDomainSettings: builder.mutation<{ success: boolean }, void>({
      query: () => ({
        url: "/v1/producer/configuration/domain",
        method: "DELETE",
      }),
      invalidatesTags: ["Configuration"],
    }),

    // Payment Receiver
    getPaymentReceiverSettings: builder.query<ConfigurationResponse<PaymentReceiverSettings>, void>({
      query: () => "/v1/producer/configuration/payment-receiver",
      providesTags: ["Configuration"],
    }),
    createPaymentReceiverSettings: builder.mutation<ConfigurationResponse<PaymentReceiverSettings>, Omit<PaymentReceiverSettings, "id" | "created_at" | "updated_at">>({
      query: (body) => ({
        url: "/v1/producer/configuration/payment-receiver",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Configuration"],
    }),
    updatePaymentReceiverSettings: builder.mutation<ConfigurationResponse<PaymentReceiverSettings>, Omit<PaymentReceiverSettings, "id" | "created_at" | "updated_at">>({
      query: (body) => ({
        url: "/v1/producer/configuration/payment-receiver",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Configuration"],
    }),
    deletePaymentReceiverSettings: builder.mutation<{ success: boolean }, void>({
      query: () => ({
        url: "/v1/producer/configuration/payment-receiver",
        method: "DELETE",
      }),
      invalidatesTags: ["Configuration"],
    }),
  }),
});

// Export hooks
export const {
  useGetPaymentGatewaySettingsQuery,
  useCreatePaymentGatewaySettingsMutation,
  useUpdatePaymentGatewaySettingsMutation,
  useDeletePaymentGatewaySettingsMutation,
  useGetDomainSettingsQuery,
  useCreateDomainSettingsMutation,
  useUpdateDomainSettingsMutation,
  useDeleteDomainSettingsMutation,
  useGetPaymentReceiverSettingsQuery,
  useCreatePaymentReceiverSettingsMutation,
  useUpdatePaymentReceiverSettingsMutation,
  useDeletePaymentReceiverSettingsMutation,
} = configurationApi;

