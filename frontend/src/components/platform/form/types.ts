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

// Default policy templates with {{LEGAL_NAME}} placeholder
export const DEFAULT_POLICY_TEMPLATES = {
  about_us: `Welcome to {{LEGAL_NAME}} - your destination for high-quality live and on-demand event streaming. We specialize in delivering seamless digital experiences for concerts, corporate events, cultural performances, and more. Our platform empowers creators and organizers to reach audiences globally while offering secure, high-definition streaming directly from their own websites.`,

  terms_of_service: `These Terms of Service ("Terms") govern your use of the {{LEGAL_NAME}} platform and services.

Usage: By accessing or using our services, you agree to comply with these Terms.

Accounts: You are responsible for maintaining the confidentiality of your access credentials.

Purchases & Access: All ticket purchases grant access to a stream or video as per the event description.

Prohibited Conduct: Users may not share access links or attempt to record streams unless explicitly allowed.

Termination: {{LEGAL_NAME}} reserves the right to suspend access in case of policy violations.`,

  privacy_policy: `At {{LEGAL_NAME}}, we respect your privacy. This policy outlines how we collect, use, and protect your information.

Data Collected: Name, email, payment information, device/IP data.

Usage: For delivering services, improving experience, and sending essential communication.

Security: We use encryption and secure storage practices.

Third Parties: We do not sell your data. Data may be shared with payment and email providers strictly for service delivery.`,

  refund_policy: `All sales on {{LEGAL_NAME}} are final unless:

• The event was canceled by the organizer.

• There were confirmed technical failures for 80% of the event from our side preventing access to the livestream/VOD.

If eligible, refunds will be processed within 7-10 working days. Contact us with your order ID.`,

  faqs: `1. How do I access a livestream or video?
After purchasing a ticket, you will receive a unique viewing link via email. Click it to start watching. You can also login on this platform to access your purchases and watch the same.

2. Can I watch from multiple devices?
No, your viewing link works on one device/location at a time. If you need to reset your link, use the "Reset" option shown on the viewing page.

3. What devices are supported?
All modern browsers on phones, tablets, laptops, and smart TVs.

4. I didn't get my viewing link. What should I do?
Check spam or promotions tab. If not found, contact our support.

5. Can I cast to a TV?
Yes, if using supported browsers/devices. Use Chromecast or screen mirroring for best results.`,

  contact_us: `Name - {{LEGAL_NAME}}
Address - [Your Address]
Phone Number - [Your Phone]
Email address - [Your Email]`,
} as const;

// Function to generate policy content with legal name
export function generatePolicyContent(
  policyKey: keyof typeof DEFAULT_POLICY_TEMPLATES,
  legalName: string
): string {
  const template = DEFAULT_POLICY_TEMPLATES[policyKey];
  return template.replace(/\{\{LEGAL_NAME\}\}/g, legalName || "[Your Company Name]");
}

// Function to generate all default policies with legal name
export function generateDefaultPolicies(legalName: string): FooterPolicies {
  return {
    about_us: {
      title: "About Us",
      content: generatePolicyContent("about_us", legalName),
    },
    terms_of_service: {
      title: "Terms of Service",
      content: generatePolicyContent("terms_of_service", legalName),
    },
    privacy_policy: {
      title: "Privacy Policy",
      content: generatePolicyContent("privacy_policy", legalName),
    },
    refund_policy: {
      title: "Refund Policy",
      content: generatePolicyContent("refund_policy", legalName),
    },
    faqs: {
      title: "FAQs",
      content: generatePolicyContent("faqs", legalName),
    },
    contact_us: {
      title: "Contact Us",
      content: generatePolicyContent("contact_us", legalName),
    },
  };
}

// Check if a policy content is empty or uses default placeholder
export function isPolicyEmpty(content: string | undefined): boolean {
  return !content || content.trim() === "";
}

// Re-export types for convenience
export type { FeaturedImage, FooterPolicies, SupportChannel, SocialLink, PlatformCouponCode, SupportChannelType };

