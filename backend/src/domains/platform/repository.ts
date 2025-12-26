// Platform settings repository using Drizzle ORM
import { eq, and } from 'drizzle-orm';
import { db, platformSettings } from '../../db/index';
import type { PlatformSettings, UpdatePlatformSettingsRequest, CouponCode } from './types';

// Helper to extract settings from jsonb value
const extractSettings = (settingValue: unknown): Record<string, unknown> => {
  if (typeof settingValue === 'object' && settingValue !== null) {
    return settingValue as Record<string, unknown>;
  }
  return {};
};

// Transform database row to API response format
const transformSettings = (row: typeof platformSettings.$inferSelect): PlatformSettings => {
  const value = extractSettings(row.settingValue);
  return {
    id: row.id,
    app_id: row.appId,
    tenant_id: row.tenantId,
    legal_name: (value.legal_name as string) || '',
    logo_url: (value.logo_url as string) || '',
    enable_cart: (value.enable_cart as boolean) ?? true,
    featured_images: (value.featured_images as PlatformSettings['featured_images']) || [],
    default_language: (value.default_language as string) || 'en',
    footer_policies: (value.footer_policies as PlatformSettings['footer_policies']) || {},
    support_channels: (value.support_channels as PlatformSettings['support_channels']) || [],
    social_links: (value.social_links as PlatformSettings['social_links']) || [],
    coupon_codes: (value.coupon_codes as PlatformSettings['coupon_codes']) || [],
    enable_live_chat: (value.enable_live_chat as boolean) ?? false,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
  };
};

export const getByAppAndTenant = async (
  appId: string,
  tenantId: string
): Promise<PlatformSettings | null> => {
  const [settings] = await db
    .select()
    .from(platformSettings)
    .where(
      and(
        eq(platformSettings.appId, appId),
        eq(platformSettings.tenantId, tenantId)
      )
    )
    .limit(1);

  return settings ? transformSettings(settings) : null;
};

export const upsert = async (
  appId: string,
  tenantId: string,
  data: UpdatePlatformSettingsRequest
): Promise<PlatformSettings> => {
  const existing = await getByAppAndTenant(appId, tenantId);

  // Build the settings value object
  const currentValue = existing ? extractSettings((await db
    .select()
    .from(platformSettings)
    .where(eq(platformSettings.id, existing.id))
    .limit(1))[0]?.settingValue) : {};
  
  const settingValue: Record<string, unknown> = { ...currentValue };
  
  if (data.legal_name !== undefined) settingValue.legal_name = data.legal_name;
  if (data.logo_url !== undefined) settingValue.logo_url = data.logo_url;
  if (data.enable_cart !== undefined) settingValue.enable_cart = data.enable_cart;
  if (data.featured_images !== undefined) settingValue.featured_images = data.featured_images;
  if (data.default_language !== undefined) settingValue.default_language = data.default_language;
  if (data.footer_policies !== undefined) settingValue.footer_policies = data.footer_policies;
  if (data.support_channels !== undefined) settingValue.support_channels = data.support_channels;
  if (data.social_links !== undefined) settingValue.social_links = data.social_links;
  if (data.coupon_codes !== undefined) settingValue.coupon_codes = data.coupon_codes;
  if (data.enable_live_chat !== undefined) settingValue.enable_live_chat = data.enable_live_chat;

  if (existing) {
    const [updated] = await db
      .update(platformSettings)
      .set({
        settingValue,
        updatedAt: new Date(),
      })
      .where(eq(platformSettings.id, existing.id))
      .returning();

    return transformSettings(updated);
  }

  const [created] = await db
    .insert(platformSettings)
    .values({
      appId,
      tenantId,
      settingKey: 'platform',
      settingValue: {
        legal_name: data.legal_name || '',
        logo_url: data.logo_url || '',
        enable_cart: data.enable_cart ?? true,
        featured_images: data.featured_images || [],
        default_language: data.default_language || 'en',
        footer_policies: data.footer_policies || {},
        support_channels: data.support_channels || [],
        social_links: data.social_links || [],
        coupon_codes: data.coupon_codes || [],
        enable_live_chat: data.enable_live_chat ?? false,
      },
    })
    .returning();

  return transformSettings(created);
};

export const updateCouponUsage = async (
  appId: string,
  tenantId: string,
  couponCode: string
): Promise<boolean> => {
  const [row] = await db
    .select()
    .from(platformSettings)
    .where(
      and(
        eq(platformSettings.appId, appId),
        eq(platformSettings.tenantId, tenantId)
      )
    )
    .limit(1);

  if (!row) return false;

  const settingValue = extractSettings(row.settingValue);
  const coupons = (settingValue.coupon_codes || []) as CouponCode[];
  const couponIndex = coupons.findIndex(
    (c) => c.code.toLowerCase() === couponCode.toLowerCase()
  );

  if (couponIndex === -1) return false;

  coupons[couponIndex].used_count += 1;
  settingValue.coupon_codes = coupons;

  await db
    .update(platformSettings)
    .set({
      settingValue,
      updatedAt: new Date(),
    })
    .where(eq(platformSettings.id, row.id));

  return true;
};

export const getCouponByCode = async (
  appId: string,
  tenantId: string,
  code: string
): Promise<CouponCode | null> => {
  const [row] = await db
    .select()
    .from(platformSettings)
    .where(
      and(
        eq(platformSettings.appId, appId),
        eq(platformSettings.tenantId, tenantId)
      )
    )
    .limit(1);

  if (!row) return null;

  const settingValue = extractSettings(row.settingValue);
  const coupons = (settingValue.coupon_codes || []) as CouponCode[];
  return (
    coupons.find((c) => c.code.toLowerCase() === code.toLowerCase()) || null
  );
};
