"use client";

import { useState, useCallback, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useFileUpload } from "@/hooks/useFileUpload";
import {
  useGetPlatformSettingsQuery,
  useUpdatePlatformSettingsMutation,
  type UpdatePlatformSettingsRequest,
} from "@/store/api";
import type {
  PlatformFormData,
  FeaturedImageFormData,
  CouponCodeFormData,
  SupportChannelFormData,
  SocialLinkFormData,
} from "@/components/platform/form/types";
import { DEFAULT_PLATFORM_FORM_VALUES } from "@/components/platform/form/types";

export function usePlatformForm() {
  const { toast } = useToast();
  const { getAccessToken } = useAuth();
  const { uploadFileSimple, isUploading: isUploadingFile } = useFileUpload({ category: "platform" });

  // API hooks
  const { data: settingsData, isLoading: isLoadingSettings } = useGetPlatformSettingsQuery();
  const [updateSettings, { isLoading: isUpdating }] = useUpdatePlatformSettingsMutation();

  // Form state
  const [formData, setFormData] = useState<PlatformFormData>(DEFAULT_PLATFORM_FORM_VALUES);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Transform API data to form data
  const transformToFormData = useCallback((data: typeof settingsData): PlatformFormData => {
    if (!data?.data) return DEFAULT_PLATFORM_FORM_VALUES;

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
  }, []);

  // Initialize form data when API data is loaded
  useEffect(() => {
    if (settingsData && !hasInitialized) {
      setFormData(transformToFormData(settingsData));
      setHasInitialized(true);
    }
  }, [settingsData, hasInitialized, transformToFormData]);

  // Form change handler
  const handleFormChange = useCallback((data: Partial<PlatformFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  }, []);

  // Upload logo file to S3
  const uploadLogo = useCallback(async (file: File): Promise<string | null> => {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      throw new Error("No access token available");
    }

    const result = await uploadFileSimple(file, accessToken, "platform");
    if (result.success && result.file) {
      return result.file.url;
    } else {
      throw new Error(result.error || "Failed to upload logo");
    }
  }, [getAccessToken, uploadFileSimple]);

  // Upload featured images to S3
  const uploadFeaturedImages = useCallback(async (
    images: FeaturedImageFormData[]
  ): Promise<FeaturedImageFormData[]> => {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      throw new Error("No access token available");
    }

    const uploadedImages: FeaturedImageFormData[] = [];

    for (const image of images) {
      // If there's a file to upload (new image)
      if (image.file && image.url?.startsWith("blob:")) {
        const result = await uploadFileSimple(image.file, accessToken, "platform");
        if (result.success && result.file) {
          uploadedImages.push({
            ...image,
            url: result.file.url,
            file: undefined, // Clear the file after upload
          });
        } else {
          throw new Error(result.error || `Failed to upload image: ${image.alt || "banner"}`);
        }
      } else if (image.url && !image.url.startsWith("blob:")) {
        // Existing image with valid URL
        uploadedImages.push(image);
      }
      // Skip images with blob URLs but no file (shouldn't happen)
    }

    return uploadedImages;
  }, [getAccessToken, uploadFileSimple]);

  // Transform form data to API request
  const transformToApiRequest = useCallback((data: PlatformFormData): UpdatePlatformSettingsRequest => {
    return {
      legal_name: data.legal_name || undefined,
      logo_url: data.logo_url || undefined,
      enable_cart: data.enable_cart,
      featured_images: data.featured_images
        .filter((img) => img.url && !img.url.startsWith("blob:"))
        .map((img) => ({
          url: img.url,
          alt: img.alt,
          link: img.link,
        })),
      default_language: data.default_language || undefined,
      footer_policies: data.footer_policies,
      support_channels: data.support_channels.map((channel) => ({
        type: channel.type,
        value: channel.value,
        label: channel.label,
      })),
      social_links: data.social_links.map((link) => ({
        platform: link.platform,
        url: link.url,
        icon: link.icon,
      })),
      coupon_codes: data.coupon_codes.map((coupon) => ({
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
      enable_live_chat: data.enable_live_chat,
    };
  }, []);

  // Handle form submission with file uploads
  const handleSubmit = useCallback(async (data: PlatformFormData) => {
    try {
      let updatedData = { ...data };

      // Check if we have files to upload
      const hasLogoFile = data.logo_file && data.logo_url?.startsWith("blob:");
      const hasFeaturedImageFiles = data.featured_images.some(
        (img) => img.file && img.url?.startsWith("blob:")
      );

      // Upload files if needed
      if (hasLogoFile || hasFeaturedImageFiles) {
        toast({
          title: "Uploading images...",
          description: "Please wait while we upload your images.",
        });

        // Upload logo if present
        if (hasLogoFile && data.logo_file) {
          const logoUrl = await uploadLogo(data.logo_file);
          if (logoUrl) {
            updatedData.logo_url = logoUrl;
            updatedData.logo_file = undefined;
          }
        }

        // Upload featured images if present
        if (hasFeaturedImageFiles) {
          const uploadedImages = await uploadFeaturedImages(data.featured_images);
          updatedData.featured_images = uploadedImages;
        }

        // Update local form state with uploaded URLs
        setFormData(updatedData);
      }

      // Transform and submit to API
      const requestData = transformToApiRequest(updatedData);
      await updateSettings(requestData).unwrap();

      toast({
        title: "Settings Saved",
        description: "Your platform settings have been updated successfully.",
      });

      return true;
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast({
        title: "Error",
        description: error instanceof Error 
          ? error.message 
          : "Failed to save settings. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  }, [toast, uploadLogo, uploadFeaturedImages, transformToApiRequest, updateSettings]);

  return {
    formData,
    isLoading: isLoadingSettings,
    isSubmitting: isUpdating || isUploadingFile,
    handleFormChange,
    handleSubmit,
  };
}

