"use client";

import { useCallback } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Navbar } from "@/components/layout";
import { useToast } from "@/hooks/use-toast";
import {
  useGetPlatformSettingsQuery,
  useUpdatePlatformSettingsMutation,
  type UpdatePlatformSettingsRequest,
} from "@/store/api";
import {
  PlatformForm,
  PlatformBackground,
  type PlatformFormData,
  type CouponCodeFormData,
  type SupportChannelFormData,
  type SocialLinkFormData,
  type FeaturedImageFormData,
} from "@/components/platform";

function PlatformContent() {
  const { toast } = useToast();

  // API hooks
  const { data: settingsData, isLoading } = useGetPlatformSettingsQuery();
  const [updateSettings, { isLoading: isSubmitting }] = useUpdatePlatformSettingsMutation();

  // Transform API data to form data
  const transformToFormData = (data: typeof settingsData): Partial<PlatformFormData> | undefined => {
    if (!data?.data) return undefined;

    const settings = data.data;
    return {
      legal_name: settings.legal_name || "",
      logo_url: settings.logo_url || "",
      enable_cart: settings.enable_cart ?? true,
      featured_images: (settings.featured_images || []).map((img, index) => ({
        ...img,
        id: `image_${index}`,
        isExisting: true,
      })),
      default_language: settings.default_language || "en",
      footer_policies: settings.footer_policies || {},
      support_channels: (settings.support_channels || []).map((channel, index) => ({
        ...channel,
        id: `channel_${index}`,
      })),
      social_links: (settings.social_links || []).map((link, index) => ({
        ...link,
        id: `link_${index}`,
      })),
      coupon_codes: (settings.coupon_codes || []).map((coupon, index) => ({
        ...coupon,
        id: `coupon_${index}`,
        valid_from: coupon.valid_from
          ? new Date(coupon.valid_from).toISOString().slice(0, 16)
          : "",
        valid_until: coupon.valid_until
          ? new Date(coupon.valid_until).toISOString().slice(0, 16)
          : "",
      })),
      enable_live_chat: settings.enable_live_chat ?? false,
    };
  };

  // Transform form data to API request
  const transformToApiRequest = (formData: PlatformFormData): UpdatePlatformSettingsRequest => {
    return {
      legal_name: formData.legal_name || undefined,
      logo_url: formData.logo_url || undefined,
      enable_cart: formData.enable_cart,
      featured_images: formData.featured_images
        .filter((img: FeaturedImageFormData) => img.url && !img.url.startsWith("blob:"))
        .map((img: FeaturedImageFormData) => ({
          url: img.url,
          alt: img.alt,
          link: img.link,
        })),
      default_language: formData.default_language || undefined,
      footer_policies: formData.footer_policies,
      support_channels: formData.support_channels.map((channel: SupportChannelFormData) => ({
        type: channel.type,
        value: channel.value,
        label: channel.label,
      })),
      social_links: formData.social_links.map((link: SocialLinkFormData) => ({
        platform: link.platform,
        url: link.url,
        icon: link.icon,
      })),
      coupon_codes: formData.coupon_codes.map((coupon: CouponCodeFormData) => ({
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: Number(coupon.discount_value) || 0,
        min_purchase: coupon.min_purchase ? Number(coupon.min_purchase) : undefined,
        max_discount: coupon.max_discount ? Number(coupon.max_discount) : undefined,
        valid_from: coupon.valid_from || undefined,
        valid_until: coupon.valid_until || undefined,
        usage_limit: coupon.usage_limit ? Number(coupon.usage_limit) : undefined,
        used_count: Number(coupon.used_count) || 0,
        is_active: coupon.is_active ?? true,
      })),
      enable_live_chat: formData.enable_live_chat,
    };
  };

  // Handle form submission
  const handleSubmit = useCallback(
    async (formData: PlatformFormData) => {
      try {
        const requestData = transformToApiRequest(formData);
        await updateSettings(requestData).unwrap();
        toast({
          title: "Settings Saved",
          description: "Your platform settings have been updated successfully.",
        });
      } catch (error) {
        console.error("Failed to save settings:", error);
        toast({
          title: "Error",
          description: "Failed to save settings. Please try again.",
          variant: "destructive",
        });
      }
    },
    [updateSettings, toast]
  );

  const initialData = transformToFormData(settingsData);

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden">
      <PlatformBackground />

      <Navbar />

      <main className="container mx-auto px-4 lg:px-6 py-8 relative z-10">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Platform Settings</h1>
          <p className="text-muted-foreground">
            Configure your platform appearance, policies, and functionality
          </p>
        </div>

        {/* Platform Form */}
        <PlatformForm
          initialData={initialData}
          isLoading={isLoading}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
        />
      </main>
    </div>
  );
}

export default function ProducerPlatformPage() {
  return (
    <ProtectedRoute>
      <PlatformContent />
    </ProtectedRoute>
  );
}

