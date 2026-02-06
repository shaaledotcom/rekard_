"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useFileUpload } from "@/hooks/useFileUpload";
import {
  useGetTicketQuery,
  useGetEventsQuery,
  useCreateTicketMutation,
  useUpdateTicketMutation,
} from "@/store/api";
import type { TicketFormData, MediaFiles } from "@/components/tickets/form";
import { DEFAULT_TICKET_FORM_VALUES } from "@/components/tickets/form";

interface UseTicketFormOptions {
  ticketId?: number;
}

export function useTicketForm(options: UseTicketFormOptions = {}) {
  const { ticketId } = options;
  const router = useRouter();
  const { toast } = useToast();
  const { getAccessToken } = useAuth();
  const { uploadFileSimple, uploadMedia, isUploading: isUploadingFile } = useFileUpload({ category: "tickets" });

  // Events pagination state
  const [eventsPage, setEventsPage] = useState(1);
  const [eventsSearch, setEventsSearch] = useState("");

  // Fetch ticket data if editing
  const { 
    data: ticketData, 
    isLoading: ticketLoading 
  } = useGetTicketQuery(ticketId!, {
    skip: !ticketId,
  });

  // Fetch events for selection - exclude draft events
  // Events in draft status should not be available for ticket creation
  const { 
    data: eventsData, 
    isLoading: eventsLoading 
  } = useGetEventsQuery({
    page: eventsPage,
    page_size: 10,
    search: eventsSearch || undefined,
    sort_by: "start_datetime",
    sort_order: "desc",
  });
  
  // Filter out draft events - only published, live, completed events can be linked to tickets
  const filteredEvents = (eventsData?.data || []).filter(
    (event) => event.status !== "draft" && event.status !== "cancelled" && event.status !== "archived"
  );

  // Mutations
  const [createTicket, { isLoading: isCreating }] = useCreateTicketMutation();
  const [updateTicket, { isLoading: isUpdating }] = useUpdateTicketMutation();

  // Transform ticket data to form data - memoized to prevent unnecessary re-renders
  const initialData = useMemo((): Partial<TicketFormData> | undefined => {
    if (!ticketData?.data) return undefined;

    const ticket = ticketData.data;
    
    // Build pricing array - use ticket.pricing if it has data, otherwise fallback to single price/currency
    const pricingData = ticket.pricing && ticket.pricing.length > 0
      ? ticket.pricing.map((p) => ({
          currency: p.currency,
          price: p.price,
        }))
      : [{ currency: ticket.currency || "INR", price: ticket.price ?? 0 }];
    
    // Strip any https:// prefix from URL slug (legacy data cleanup)
    const cleanUrl = (ticket.url || "")
      .replace(/^https?:\/\//, "")
      .replace(/^[^/]+\//, ""); // Remove domain if present
    
    return {
      title: ticket.title,
      url: cleanUrl,
      description: ticket.description || "",
      thumbnail_image_portrait: ticket.thumbnail_image_portrait,
      featured_image: ticket.featured_image,
      featured_video: ticket.featured_video,
      is_fundraiser: ticket.is_fundraiser ?? false,
      event_ids: ticket.events?.map((e) => e.id) || [],
      pricing: pricingData,
      coupons: ticket.coupons?.map((c) => ({
        title: c.title,
        code: c.code,
        count: c.count,
        activation_time: c.activation_time || "",
        expiry_time: c.expiry_time || "",
        discount: String(c.discount),
      })) || [],
      sponsors: ticket.sponsors?.map((s) => ({
        title: s.title,
        image_url: s.image_url,
        link: s.link,
      })) || [],
      total_quantity: ticket.total_quantity || 100,
      status: ticket.status,
      geoblocking_enabled: ticket.geoblocking_enabled,
      geoblocking_countries: ticket.geoblocking_countries || [],
    };
  }, [ticketData]);

  // Upload media files to S3 and return URLs
  const uploadMediaFiles = useCallback(
    async (
      mediaFiles: MediaFiles,
      formData: TicketFormData
    ): Promise<{
      thumbnail_image_portrait?: string;
      featured_image?: string;
      featured_video?: string;
    }> => {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error("Not authenticated");
      }

      const urls: {
        thumbnail_image_portrait?: string;
        featured_image?: string;
        featured_video?: string;
      } = {
        // Keep existing URLs if no new file is uploaded
        thumbnail_image_portrait: formData.thumbnail_image_portrait,
        featured_image: formData.featured_image,
        featured_video: formData.featured_video,
      };

      // Upload thumbnail image
      if (mediaFiles.thumbnailImagePortrait) {
        const result = await uploadFileSimple(
          mediaFiles.thumbnailImagePortrait,
          accessToken,
          "tickets"
        );
        if (result.success && result.file) {
          urls.thumbnail_image_portrait = result.file.url;
        } else {
          throw new Error(result.error || "Failed to upload thumbnail image");
        }
      }

      // Upload featured image
      if (mediaFiles.featuredImage) {
        const result = await uploadFileSimple(
          mediaFiles.featuredImage,
          accessToken,
          "tickets"
        );
        if (result.success && result.file) {
          urls.featured_image = result.file.url;
        } else {
          throw new Error(result.error || "Failed to upload featured image");
        }
      }

      // Upload featured video
      if (mediaFiles.featuredVideo) {
        const result = await uploadMedia(
          mediaFiles.featuredVideo,
          accessToken,
          "tickets"
        );
        if (result.success && result.file) {
          urls.featured_video = result.file.url;
        } else {
          throw new Error(result.error || "Failed to upload featured video");
        }
      }

      return urls;
    },
    [getAccessToken, uploadFileSimple, uploadMedia]
  );

  // Upload sponsor images to S3
  const uploadSponsorImages = useCallback(
    async (
      sponsors: TicketFormData["sponsors"]
    ): Promise<Array<{ title: string; image_url?: string }>> => {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error("Not authenticated");
      }

      const uploadedSponsors: Array<{ title: string; image_url?: string; link?: string }> = [];

      for (const sponsor of sponsors) {
        if (sponsor.image_file) {
          // Upload the sponsor image
          const result = await uploadFileSimple(
            sponsor.image_file,
            accessToken,
            "tickets"
          );
          if (result.success && result.file) {
            uploadedSponsors.push({
              title: sponsor.title,
              image_url: result.file.url,
              link: sponsor.link,
            });
          } else {
            throw new Error(result.error || "Failed to upload sponsor image");
          }
        } else {
          // Keep existing URL or no image
          uploadedSponsors.push({
            title: sponsor.title,
            image_url: sponsor.image_url,
            link: sponsor.link,
          });
        }
      }

      return uploadedSponsors;
    },
    [getAccessToken, uploadFileSimple]
  );

  // Handle form submission
  const handleSubmit = useCallback(async (formData: TicketFormData, mediaFiles: MediaFiles) => {
    try {
      // Upload media files to S3 first
      const hasMediaFiles = 
        mediaFiles.thumbnailImagePortrait || 
        mediaFiles.featuredImage || 
        mediaFiles.featuredVideo;
      
      const hasSponsorFiles = formData.sponsors.some((s) => s.image_file);

      let mediaUrls: {
        thumbnail_image_portrait?: string;
        featured_image?: string;
        featured_video?: string;
      } = {
        thumbnail_image_portrait: formData.thumbnail_image_portrait,
        featured_image: formData.featured_image,
        featured_video: formData.featured_video,
      };

      let uploadedSponsors: Array<{ title: string; image_url?: string; link?: string }> = formData.sponsors.map((s) => ({
        title: s.title,
        image_url: s.image_url,
        link: s.link,
      }));

      // Upload media files if any
      if (hasMediaFiles) {
        toast({
          title: "Uploading media...",
          description: "Please wait while we upload your images and videos.",
        });
        mediaUrls = await uploadMediaFiles(mediaFiles, formData);
      }

      // Upload sponsor images if any
      if (hasSponsorFiles) {
        uploadedSponsors = await uploadSponsorImages(formData.sponsors);
      }

      // Build the request data
      const mainPricing = formData.pricing[0] || { currency: "INR", price: 0 };
      
      // Transform coupons for API
      const couponsForApi = formData.coupons.length > 0 
        ? formData.coupons.map((c) => ({
            title: c.title,
            code: c.code,
            count: c.count,
            activation_time: c.activation_time || undefined,
            expiry_time: c.expiry_time || undefined,
            discount: parseFloat(c.discount) || 0,
          }))
        : undefined;

      // Transform pricing for API
      const pricingForApi = formData.pricing.length > 0
        ? formData.pricing.map((p) => ({
            currency: p.currency,
            price: p.price,
          }))
        : undefined;

      // Transform sponsors for API with uploaded URLs
      const sponsorsForApi = uploadedSponsors.length > 0
        ? uploadedSponsors.filter((s) => s.title) // Only include sponsors with titles
        : undefined;
      
      const requestData = {
        title: formData.title,
        description: formData.description || undefined,
        url: formData.url || undefined,
        thumbnail_image_portrait: mediaUrls.thumbnail_image_portrait || undefined,
        featured_image: mediaUrls.featured_image || undefined,
        featured_video: mediaUrls.featured_video || undefined,
        is_fundraiser: formData.is_fundraiser,
        price: mainPricing.price,
        currency: mainPricing.currency,
        total_quantity: formData.total_quantity,
        geoblocking_enabled: formData.geoblocking_enabled,
        geoblocking_countries: formData.geoblocking_countries.length > 0 
          ? formData.geoblocking_countries 
          : undefined,
        status: formData.status,
        event_ids: formData.event_ids.length > 0 ? formData.event_ids : undefined,
        coupons: couponsForApi,
        pricing: pricingForApi,
        sponsors: sponsorsForApi,
      };

      if (ticketId) {
        await updateTicket({ id: ticketId, data: requestData }).unwrap();
        toast({
          title: "Ticket Updated! ✨",
          description: "Your changes have been saved successfully.",
        });
      } else {
        await createTicket(requestData).unwrap();
        toast({
          title: "Ticket Created! 🎫",
          description: "Your new ticket is ready to sell.",
        });
      }

      // Navigate back to tickets list
      router.push("/producer/tickets");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Something went wrong. Please try again.";
      toast({
        title: "Oops!",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [ticketId, createTicket, updateTicket, router, toast, uploadMediaFiles, uploadSponsorImages]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    router.push("/producer/tickets");
  }, [router]);

  // Events search handler
  const handleEventsSearch = useCallback((query: string) => {
    setEventsSearch(query);
    setEventsPage(1);
  }, []);

  // Events page change handler
  const handleEventsPageChange = useCallback((page: number) => {
    setEventsPage(page);
  }, []);

  return {
    // Ticket data
    ticketId,
    initialData,
    isLoading: ticketLoading,
    isSubmitting: isCreating || isUpdating || isUploadingFile,

    // Events data - filtered to exclude drafts, cancelled, archived
    events: filteredEvents,
    eventsLoading,
    totalEvents: filteredEvents.length,
    totalEventsPages: eventsData?.total_pages || 1,
    currentEventsPage: eventsPage,
    eventsSearchQuery: eventsSearch,

    // Handlers
    onSubmit: handleSubmit,
    onCancel: handleCancel,
    onEventsSearch: handleEventsSearch,
    onEventsPageChange: handleEventsPageChange,
  };
}

