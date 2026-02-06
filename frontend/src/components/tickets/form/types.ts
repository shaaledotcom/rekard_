import type { TicketStatus, GeoblockingLocation } from "@/store/api";

// Form step types
export type FormStep = "basic-details" | "settings" | "coupons-sponsors";

export interface StepConfig {
  key: FormStep;
  title: string;
  description: string;
}

export const FORM_STEPS: StepConfig[] = [
  { key: "basic-details", title: "Basic Details", description: "Title, Media & Description" },
  { key: "settings", title: "Settings", description: "Events, Pricing & Configuration" },
  { key: "coupons-sponsors", title: "Coupons & Sponsors", description: "Discount Codes & Partners" },
];

// Coupon form type
export interface CouponFormData {
  title: string;
  code: string;
  count: number;
  activation_time: string;
  expiry_time: string;
  discount: string;
}

// Pricing form type
export interface PricingFormData {
  currency: string;
  price: number;
}

// Sponsor form type
export interface SponsorFormData {
  title: string;
  image_url?: string;
  image_file?: File;
  link?: string;
}

// Main ticket form data
export interface TicketFormData {
  title: string;
  url: string;
  description: string;
  thumbnail_image_portrait?: string;
  featured_image?: string;
  featured_video?: string;
  is_fundraiser: boolean;
  event_ids: number[];
  pricing: PricingFormData[];
  coupons: CouponFormData[];
  sponsors: SponsorFormData[];
  total_quantity: number;
  status: TicketStatus;
  geoblocking_enabled: boolean;
  geoblocking_countries: GeoblockingLocation[];
}

// Media files for upload
export interface MediaFiles {
  thumbnailImagePortrait?: File;
  featuredImage?: File;
  featuredVideo?: File;
}

// Currency option
export interface CurrencyOption {
  value: string;
  label: string;
  symbol: string;
}

export const CURRENCY_OPTIONS: CurrencyOption[] = [
  { value: "INR", label: "INR - Indian Rupee", symbol: "₹" },
  { value: "USD", label: "USD - Dollar", symbol: "$" },
];

// Status options
export interface StatusOption {
  value: TicketStatus;
  label: string;
}

export const STATUS_OPTIONS: StatusOption[] = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "sold_out", label: "Sold Out" },
  { value: "archived", label: "Archived" },
];

// Default form values
export const DEFAULT_TICKET_FORM_VALUES: TicketFormData = {
  title: "",
  url: "",
  description: "",
  is_fundraiser: false,
  event_ids: [],
  pricing: [{ currency: "INR", price: 0 }],
  coupons: [],
  sponsors: [],
  total_quantity: 100,
  status: "draft",
  geoblocking_enabled: false,
  geoblocking_countries: [],
};

