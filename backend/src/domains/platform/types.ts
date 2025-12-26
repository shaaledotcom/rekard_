// Platform settings types

export type FeaturedImage = {
  url: string;
  alt?: string;
  link?: string;
};

export type FooterPolicy = {
  title: string;
  content: string;
  url?: string;
};

export type FooterPolicies = {
  terms_of_service?: FooterPolicy;
  privacy_policy?: FooterPolicy;
  refund_policy?: FooterPolicy;
  cookie_policy?: FooterPolicy;
};

export type SupportChannel = {
  type: 'email' | 'phone' | 'whatsapp' | 'telegram' | 'chat';
  value: string;
  label?: string;
};

export type SocialLink = {
  platform: string;
  url: string;
  icon?: string;
};

export type CouponCode = {
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_purchase?: number;
  max_discount?: number;
  valid_from?: Date;
  valid_until?: Date;
  usage_limit?: number;
  used_count: number;
  is_active: boolean;
};

export type PlatformSettings = {
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
  coupon_codes: CouponCode[];
  enable_live_chat: boolean;
  created_at: Date;
  updated_at: Date;
};

export type UpdatePlatformSettingsRequest = {
  legal_name?: string;
  logo_url?: string;
  enable_cart?: boolean;
  featured_images?: FeaturedImage[];
  default_language?: string;
  footer_policies?: FooterPolicies;
  support_channels?: SupportChannel[];
  social_links?: SocialLink[];
  coupon_codes?: CouponCode[];
  enable_live_chat?: boolean;
};

export type ValidateCouponRequest = {
  code: string;
  purchase_amount: number;
};

export type CouponValidationResult = {
  valid: boolean;
  coupon?: CouponCode;
  discount_amount?: number;
  error?: string;
};

