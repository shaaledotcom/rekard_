import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// Tenant configuration from backend
export interface TenantConfig {
  tenant_id: string | null;
  app_id: string;
  is_custom_domain: boolean;
  is_pro: boolean;
  legal_name: string;
  logo_url: string;
  enable_cart: boolean;
  featured_images: Array<{ url: string; alt?: string; link?: string }>;
  default_language: string;
  enable_live_chat: boolean;
  footer_policies: {
    terms_of_service?: { title: string; content: string; url?: string };
    privacy_policy?: { title: string; content: string; url?: string };
    refund_policy?: { title: string; content: string; url?: string };
    cookie_policy?: { title: string; content: string; url?: string };
    faqs?: { title: string; content: string; url?: string };
    about_us?: { title: string; content: string; url?: string };
    contact_us?: { title: string; content: string; url?: string };
  };
  support_channels: Array<{
    type: "email" | "phone" | "whatsapp" | "telegram" | "chat";
    value: string;
    label?: string;
  }>;
  social_links: Array<{ platform: string; url: string; icon?: string }>;
  razorpay_key_id: string;
}

interface TenantState {
  config: TenantConfig | null;
  isLoading: boolean;
  error: string | null;
  currentDomain: string;
}

// Default config for initial state
const defaultConfig: TenantConfig = {
  tenant_id: null,
  app_id: "public",
  is_custom_domain: false,
  is_pro: false,
  legal_name: "Rekard Media Pvt Ltd",
  logo_url: "/rekard_logo.png",
  enable_cart: false,
  featured_images: [],
  default_language: "en",
  enable_live_chat: false,
  footer_policies: {},
  support_channels: [],
  social_links: [],
  razorpay_key_id: "",
};

const initialState: TenantState = {
  config: null,
  isLoading: true,
  error: null,
  currentDomain: "",
};

const tenantSlice = createSlice({
  name: "tenant",
  initialState,
  reducers: {
    setTenantConfig: (state, action: PayloadAction<TenantConfig>) => {
      state.config = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    setTenantLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setTenantError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
      state.config = defaultConfig; // Use default on error
    },
    setCurrentDomain: (state, action: PayloadAction<string>) => {
      state.currentDomain = action.payload;
    },
    resetTenant: (state) => {
      state.config = null;
      state.isLoading = true;
      state.error = null;
    },
  },
});

export const {
  setTenantConfig,
  setTenantLoading,
  setTenantError,
  setCurrentDomain,
  resetTenant,
} = tenantSlice.actions;
export default tenantSlice.reducer;

