// Tenant configuration service - provides combined tenant settings for viewers frontend
import { env } from '../../config/env.js';
import * as platformService from '../platform/service.js';
import * as configurationService from '../configuration/service.js';
import * as tenantService from './service.js';
import type { PlatformSettings } from '../platform/types.js';
import { WATCH_REKARD_DOMAIN } from '../auth/constants.js';

/**
 * Tenant configuration for viewer frontend
 * Combines platform settings, payment config, and branding
 */
export interface TenantConfig {
  // Tenant info
  tenant_id: string | null;
  app_id: string;
  is_custom_domain: boolean;
  is_pro: boolean;
  
  // Branding
  legal_name: string;
  logo_url: string;
  
  // Platform settings
  enable_cart: boolean;
  featured_images: PlatformSettings['featured_images'];
  default_language: string;
  enable_live_chat: boolean;
  
  // Footer/Legal
  footer_policies: PlatformSettings['footer_policies'];
  support_channels: PlatformSettings['support_channels'];
  social_links: PlatformSettings['social_links'];
  
  // Payment - only expose public key
  razorpay_key_id: string;
}

/**
 * Default platform settings for shared domain (watch.rekard.com)
 */
export const getDefaultPlatformSettings = (): Omit<TenantConfig, 'tenant_id' | 'app_id' | 'is_custom_domain' | 'is_pro'> => {
  return {
    legal_name: env.platform.defaultLegalName,
    logo_url: env.platform.defaultLogoUrl,
    enable_cart: false, // No cart on shared domain for now
    featured_images: [],
    default_language: 'en',
    enable_live_chat: false,
    footer_policies: {
      terms_of_service: {
        title: 'Terms of Service',
        content: 'Terms and conditions for using Rekard platform.',
        url: env.platform.defaultTermsUrl,
      },
      privacy_policy: {
        title: 'Privacy Policy',
        content: 'How we collect, use, and protect your data.',
        url: env.platform.defaultPrivacyUrl,
      },
      refund_policy: {
        title: 'Refund Policy',
        content: 'Our refund and cancellation policy for ticket purchases.',
        url: env.platform.defaultRefundUrl,
      },
    },
    support_channels: [
      { type: 'email', value: env.platform.defaultSupportEmail, label: 'Support' },
    ],
    social_links: [],
    razorpay_key_id: env.razorpay.keyId,
  };
};

/**
 * Check if a domain is a shared/default domain
 */
export const isSharedDomain = (domain: string): boolean => {
  const cleanDomain = domain.toLowerCase().replace(/^(https?:\/\/)?/, '').split('/')[0];
  return env.platform.sharedDomains.some(shared => {
    const cleanShared = shared.toLowerCase();
    return cleanDomain === cleanShared || cleanDomain.endsWith(`.${cleanShared}`);
  });
};

/**
 * Get tenant configuration for a domain
 * 
 * @param domain - The domain to resolve (e.g., "watch.rekard.com" or "custom.domain.com")
 * @returns TenantConfig with all necessary settings for the viewer frontend
 */
export const getTenantConfigForDomain = async (domain: string): Promise<TenantConfig> => {
  // Check if this is a shared domain
  if (isSharedDomain(domain) || domain === WATCH_REKARD_DOMAIN) {
    const defaults = getDefaultPlatformSettings();
    return {
      tenant_id: null,
      app_id: 'public',
      is_custom_domain: false,
      is_pro: false,
      ...defaults,
    };
  }
  
  // Try to resolve tenant from custom domain
  const tenantInfo = await tenantService.resolveTenantFromDomain(domain);
  
  if (!tenantInfo) {
    // Domain not found - return defaults
    const defaults = getDefaultPlatformSettings();
    return {
      tenant_id: null,
      app_id: 'public',
      is_custom_domain: false,
      is_pro: false,
      ...defaults,
    };
  }
  
  // Get tenant details
  const tenant = await tenantService.getTenantById(tenantInfo.tenantId);
  if (!tenant || !tenant.is_pro) {
    // Tenant not found or not pro - return defaults
    const defaults = getDefaultPlatformSettings();
    return {
      tenant_id: null,
      app_id: 'public',
      is_custom_domain: false,
      is_pro: false,
      ...defaults,
    };
  }
  
  // Get tenant's platform settings
  const platformSettings = await platformService.getSettings(tenant.app_id, tenant.id);
  const defaults = getDefaultPlatformSettings();
  
  // Get tenant's Razorpay key if configured
  let razorpayKeyId = env.razorpay.keyId; // Default to platform key
  try {
    const paymentConfig = await configurationService.getPaymentGateway(
      tenant.app_id,
      tenant.id,
      tenant.user_id
    );
    // Check both 'key' and 'key_id' for compatibility
    const key = (paymentConfig?.settings as Record<string, unknown>)?.key || 
                (paymentConfig?.settings as Record<string, unknown>)?.key_id;
    if (key) {
      razorpayKeyId = key as string;
    }
  } catch {
    // Use default key if tenant doesn't have their own
  }
  
  return {
    tenant_id: tenant.id,
    app_id: tenant.app_id,
    is_custom_domain: true,
    is_pro: tenant.is_pro,
    
    // Use tenant settings or fall back to defaults
    legal_name: platformSettings?.legal_name || defaults.legal_name,
    logo_url: platformSettings?.logo_url || defaults.logo_url,
    enable_cart: platformSettings?.enable_cart ?? defaults.enable_cart,
    featured_images: platformSettings?.featured_images || defaults.featured_images,
    default_language: platformSettings?.default_language || defaults.default_language,
    enable_live_chat: platformSettings?.enable_live_chat ?? defaults.enable_live_chat,
    footer_policies: platformSettings?.footer_policies || defaults.footer_policies,
    support_channels: platformSettings?.support_channels || defaults.support_channels,
    social_links: platformSettings?.social_links || defaults.social_links,
    
    razorpay_key_id: razorpayKeyId,
  };
};

/**
 * Get tenant configuration by tenant ID (for authenticated requests)
 */
export const getTenantConfigById = async (tenantId: string): Promise<TenantConfig> => {
  const tenant = await tenantService.getTenantById(tenantId);
  
  if (!tenant) {
    const defaults = getDefaultPlatformSettings();
    return {
      tenant_id: null,
      app_id: 'public',
      is_custom_domain: false,
      is_pro: false,
      ...defaults,
    };
  }
  
  const platformSettings = await platformService.getSettings(tenant.app_id, tenant.id);
  const defaults = getDefaultPlatformSettings();
  
  // Get tenant's Razorpay key if configured
  let razorpayKeyId = env.razorpay.keyId;
  if (tenant.is_pro) {
    try {
      const paymentConfig = await configurationService.getPaymentGateway(
        tenant.app_id,
        tenant.id,
        tenant.user_id
      );
      // Check both 'key' and 'key_id' for compatibility
      const key = (paymentConfig?.settings as Record<string, unknown>)?.key || 
                  (paymentConfig?.settings as Record<string, unknown>)?.key_id;
      if (key) {
        razorpayKeyId = key as string;
      }
    } catch {
      // Use default
    }
  }
  
  return {
    tenant_id: tenant.id,
    app_id: tenant.app_id,
    is_custom_domain: !!tenant.primary_domain,
    is_pro: tenant.is_pro,
    
    legal_name: platformSettings?.legal_name || defaults.legal_name,
    logo_url: platformSettings?.logo_url || defaults.logo_url,
    enable_cart: platformSettings?.enable_cart ?? defaults.enable_cart,
    featured_images: platformSettings?.featured_images || defaults.featured_images,
    default_language: platformSettings?.default_language || defaults.default_language,
    enable_live_chat: platformSettings?.enable_live_chat ?? defaults.enable_live_chat,
    footer_policies: platformSettings?.footer_policies || defaults.footer_policies,
    support_channels: platformSettings?.support_channels || defaults.support_channels,
    social_links: platformSettings?.social_links || defaults.social_links,
    
    razorpay_key_id: razorpayKeyId,
  };
};

