"use client";

import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  useGetEventsQuery,
  useCreateEventMutation,
  useUpdateEventMutation,
  useDeleteEventMutation,
  usePublishEventMutation,
  useCancelEventMutation,
  useCompleteEventMutation,
  Event,
  EventStatus,
  CreateEventRequest,
  UpdateEventRequest,
} from "@/store/api";
import { defaultFormValues } from "@/components/events";

export function useEventsPage() {
  const { toast } = useToast();

  // UI state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<EventStatus | "">("");
  const [page, setPage] = useState(1);
  const [actionMenuOpen, setActionMenuOpen] = useState<number | null>(null);

  // Dialog state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState<CreateEventRequest>(defaultFormValues);

  // API hooks
  const { data: eventsData, isLoading } = useGetEventsQuery({
    page,
    page_size: 9,
    status: statusFilter || undefined,
    search: search || undefined,
    sort_by: "start_datetime",
    sort_order: "desc",
  });

  const [createEvent, { isLoading: isCreating }] = useCreateEventMutation();
  const [updateEvent, { isLoading: isUpdating }] = useUpdateEventMutation();
  const [deleteEvent, { isLoading: isDeleting }] = useDeleteEventMutation();
  const [publishEvent] = usePublishEventMutation();
  const [cancelEvent] = useCancelEventMutation();
  const [completeEvent] = useCompleteEventMutation();

  const events = eventsData?.data || [];
  const totalPages = eventsData?.total_pages || 1;

  // Event handlers
  const handleCreateEvent = useCallback(async () => {
    try {
      await createEvent(formData).unwrap();
      toast({ title: "Event Created! 🎉", description: "Your new event is ready to go." });
      setIsCreateDialogOpen(false);
      setFormData(defaultFormValues);
    } catch {
      toast({ title: "Oops!", description: "Something went wrong. Please try again.", variant: "destructive" });
    }
  }, [createEvent, formData, toast]);

  const handleUpdateEvent = useCallback(async () => {
    if (!selectedEvent) return;
    try {
      await updateEvent({ id: selectedEvent.id, data: formData as UpdateEventRequest }).unwrap();
      toast({ title: "Event Updated! ✨", description: "Your changes have been saved." });
      setIsEditDialogOpen(false);
      setSelectedEvent(null);
      setFormData(defaultFormValues);
    } catch {
      toast({ title: "Oops!", description: "Couldn't update the event. Please try again.", variant: "destructive" });
    }
  }, [updateEvent, selectedEvent, formData, toast]);

  const handleDeleteEvent = useCallback(async () => {
    if (!selectedEvent) return;
    try {
      await deleteEvent(selectedEvent.id).unwrap();
      toast({ title: "Event Deleted", description: "The event has been removed." });
      setIsDeleteDialogOpen(false);
      setSelectedEvent(null);
    } catch {
      toast({ title: "Oops!", description: "Couldn't delete the event. Please try again.", variant: "destructive" });
    }
  }, [deleteEvent, selectedEvent, toast]);

  const handlePublish = useCallback(async (event: Event) => {
    try {
      await publishEvent(event.id).unwrap();
      toast({ title: "Event Published! 🚀", description: "Your event is now live for viewers." });
      setActionMenuOpen(null);
    } catch {
      toast({ title: "Oops!", description: "Couldn't publish the event.", variant: "destructive" });
    }
  }, [publishEvent, toast]);

  const handleCancel = useCallback(async (event: Event) => {
    try {
      await cancelEvent(event.id).unwrap();
      toast({ title: "Event Cancelled", description: "The event has been cancelled." });
      setActionMenuOpen(null);
    } catch {
      toast({ title: "Oops!", description: "Couldn't cancel the event.", variant: "destructive" });
    }
  }, [cancelEvent, toast]);

  const handleComplete = useCallback(async (event: Event) => {
    try {
      await completeEvent(event.id).unwrap();
      toast({ title: "Event Completed! 🏁", description: "Great job on a successful event!" });
      setActionMenuOpen(null);
    } catch {
      toast({ title: "Oops!", description: "Couldn't complete the event.", variant: "destructive" });
    }
  }, [completeEvent, toast]);

  const openEditDialog = useCallback((event: Event) => {
    setSelectedEvent(event);
    setFormData({
      title: event.title,
      description: event.description || "",
      start_datetime: event.start_datetime,
      end_datetime: event.end_datetime,
      language: event.language,
      is_vod: event.is_vod,
      convert_to_vod_after_event: event.convert_to_vod_after_event,
      max_concurrent_viewers_per_link: event.max_concurrent_viewers_per_link,
      signup_disabled: event.signup_disabled,
      purchase_disabled: event.purchase_disabled,
      status: event.status,
      featured_image: event.featured_image,
      watch_upto: event.watch_upto || "",
      archive_after: event.archive_after || "",
    });
    setIsEditDialogOpen(true);
    setActionMenuOpen(null);
  }, []);

  const openDeleteDialog = useCallback((event: Event) => {
    setSelectedEvent(event);
    setIsDeleteDialogOpen(true);
    setActionMenuOpen(null);
  }, []);

  const openCreateDialog = useCallback(() => {
    setFormData(defaultFormValues);
    setIsCreateDialogOpen(true);
  }, []);

  const closeFormDialog = useCallback(() => {
    setIsCreateDialogOpen(false);
    setIsEditDialogOpen(false);
    setSelectedEvent(null);
    setFormData(defaultFormValues);
  }, []);

  const closeDeleteDialog = useCallback(() => {
    setIsDeleteDialogOpen(false);
    setSelectedEvent(null);
  }, []);

  const closeActionMenu = useCallback(() => {
    setActionMenuOpen(null);
  }, []);

  return {
    // UI state
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    page,
    setPage,
    actionMenuOpen,
    setActionMenuOpen,
    closeActionMenu,

    // Dialog state
    isCreateDialogOpen,
    isEditDialogOpen,
    isDeleteDialogOpen,
    selectedEvent,
    formData,
    setFormData,

    // Data
    events,
    totalPages,
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,

    // Actions
    handleCreateEvent,
    handleUpdateEvent,
    handleDeleteEvent,
    handlePublish,
    handleCancel,
    handleComplete,
    openEditDialog,
    openDeleteDialog,
    openCreateDialog,
    closeFormDialog,
    closeDeleteDialog,
  };
}

