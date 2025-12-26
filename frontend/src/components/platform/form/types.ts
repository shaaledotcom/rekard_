import type {
  FeaturedImage,
  FooterPolicies,
  SupportChannel,
  SocialLink,
  PlatformCouponCode,
  SupportChannelType,
} from "@/store/api";

// Form step types
export type FormStep = "header" | "footer" | "home" | "watch-page";

export interface StepConfig {
  key: FormStep;
  title: string;
  description: string;
}

export const FORM_STEPS: StepConfig[] = [
  { key: "header", title: "Header", description: "Logo, Cart & Coupon Settings" },
  { key: "footer", title: "Footer", description: "Legal Info, Policies & Social Links" },
  { key: "home", title: "Home", description: "Banner Images & Language" },
  { key: "watch-page", title: "Watch Page", description: "Live Chat & Comments Settings" },
];

// Form data for platform settings
export interface PlatformFormData {
  legal_name: string;
  logo_url: string;
  logo_file?: File;
  enable_cart: boolean;
  featured_images: FeaturedImageFormData[];
  default_language: string;
  footer_policies: FooterPolicies;
  support_channels: SupportChannelFormData[];
  social_links: SocialLinkFormData[];
  coupon_codes: CouponCodeFormData[];
  enable_live_chat: boolean;
}

// Extended types with form IDs for managing lists
export interface FeaturedImageFormData extends FeaturedImage {
  id: string;
  file?: File;
  isExisting?: boolean;
}

export interface SupportChannelFormData extends SupportChannel {
  id: string;
}

export interface SocialLinkFormData extends SocialLink {
  id: string;
}

export interface CouponCodeFormData extends Omit<PlatformCouponCode, 'valid_from' | 'valid_until'> {
  id: string;
  valid_from?: string;
  valid_until?: string;
}

// Default form values
export const DEFAULT_PLATFORM_FORM_VALUES: PlatformFormData = {
  legal_name: "",
  logo_url: "",
  enable_cart: true,
  featured_images: [],
  default_language: "en",
  footer_policies: {},
  support_channels: [],
  social_links: [],
  coupon_codes: [],
  enable_live_chat: false,
};

// Support channel options
export const SUPPORT_CHANNEL_TYPES: { value: SupportChannelType; label: string }[] = [
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "telegram", label: "Telegram" },
  { value: "chat", label: "Chat" },
];

// Social platform options
export const SOCIAL_PLATFORMS = [
  "youtube",
  "facebook",
  "instagram",
  "twitter",
  "linkedin",
  "website",
] as const;

// Language options
export const LANGUAGE_OPTIONS = [
  { code: "en", name: "English" },
  { code: "kn", name: "Kannada" },
  { code: "hi", name: "Hindi" },
  { code: "ta", name: "Tamil" },
  { code: "te", name: "Telugu" },
  { code: "ml", name: "Malayalam" },
] as const;

// Re-export types for convenience
export type { FeaturedImage, FooterPolicies, SupportChannel, SocialLink, PlatformCouponCode, SupportChannelType };

