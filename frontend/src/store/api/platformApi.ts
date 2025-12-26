import { api } from "./baseApi";

// Platform Settings types
export interface FeaturedImage {
  url: string;
  alt?: string;
  link?: string;
}

export interface FooterPolicy {
  title: string;
  content: string;
  url?: string;
}

export interface FooterPolicies {
  terms_of_service?: FooterPolicy;
  privacy_policy?: FooterPolicy;
  refund_policy?: FooterPolicy;
  cookie_policy?: FooterPolicy;
  about_us?: FooterPolicy;
  faqs?: FooterPolicy;
  contact_us?: FooterPolicy;
}

export type SupportChannelType = 'email' | 'phone' | 'whatsapp' | 'telegram' | 'chat';

export interface SupportChannel {
  type: SupportChannelType;
  value: string;
  label?: string;
}

export interface SocialLink {
  platform: string;
  url: string;
  icon?: string;
}

export interface PlatformCouponCode {
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_purchase?: number;
  max_discount?: number;
  valid_from?: string;
  valid_until?: string;
  usage_limit?: number;
  used_count: number;
  is_active: boolean;
}

export interface PlatformSettings {
  id: number;
  app_id: string;
  tenant_id: string;
  legal_name: string;
  logo_url: string;
  enable_cart: boolean;
  featured_images: FeaturedImage[];
  default_language: string;
  footer_policies: FooterPolicies;
  support_channels: SupportChannel[];
  social_links: SocialLink[];
  coupon_codes: PlatformCouponCode[];
  enable_live_chat: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlatformSettingsResponse {
  success: boolean;
  data: PlatformSettings | null;
  message?: string;
}

export interface UpdatePlatformSettingsRequest {
  legal_name?: string;
  logo_url?: string;
  enable_cart?: boolean;
  featured_images?: FeaturedImage[];
  default_language?: string;
  footer_policies?: FooterPolicies;
  support_channels?: SupportChannel[];
  social_links?: SocialLink[];
  coupon_codes?: PlatformCouponCode[];
  enable_live_chat?: boolean;
}

// Platform API endpoints
export const platformApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getPlatformSettings: builder.query<PlatformSettingsResponse, void>({
      query: () => "/v1/producer/platform",
      providesTags: ["Platform"],
    }),

    updatePlatformSettings: builder.mutation<PlatformSettingsResponse, UpdatePlatformSettingsRequest>({
      query: (body) => ({
        url: "/v1/producer/platform",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Platform"],
    }),
  }),
});

// Export hooks
export const {
  useGetPlatformSettingsQuery,
  useUpdatePlatformSettingsMutation,
} = platformApi;

