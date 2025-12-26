"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
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

  // Fetch events for selection
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
      })) || [],
      total_quantity: ticket.total_quantity || 100,
      status: ticket.status,
      geoblocking_enabled: ticket.geoblocking_enabled,
      geoblocking_countries: ticket.geoblocking_countries || [],
    };
  }, [ticketData]);

  // Handle form submission
  const handleSubmit = useCallback(async (formData: TicketFormData, mediaFiles: MediaFiles) => {
    try {
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

      // Transform sponsors for API
      const sponsorsForApi = formData.sponsors.length > 0
        ? formData.sponsors.map((s) => ({
            title: s.title,
            image_url: s.image_url,
          }))
        : undefined;
      
      const requestData = {
        title: formData.title,
        description: formData.description || undefined,
        url: formData.url || undefined,
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
      toast({
        title: "Oops!",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  }, [ticketId, createTicket, updateTicket, router, toast]);

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
    isSubmitting: isCreating || isUpdating,

    // Events data
    events: eventsData?.data || [],
    eventsLoading,
    totalEvents: eventsData?.total || 0,
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

