"use client";

import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useFileUpload } from "@/hooks/useFileUpload";
import {
  useGetEventsQuery,
  useCreateEventMutation,
  useUpdateEventMutation,
  useDeleteEventMutation,
  usePublishEventMutation,
  useCancelEventMutation,
  useCompleteEventMutation,
  useArchiveEventMutation,
  useSetEventDraftMutation,
  Event,
  EventStatus,
  CreateEventRequest,
  UpdateEventRequest,
} from "@/store/api";
import { defaultFormValues } from "@/components/events";

export function useEventsPage() {
  const { toast } = useToast();
  const { getAccessToken } = useAuth();
  const { uploadMedia, uploadFile } = useFileUpload({ category: "events" });

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
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [isUpdatingEvent, setIsUpdatingEvent] = useState(false);

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
  const [archiveEvent] = useArchiveEventMutation();
  const [setEventDraft] = useSetEventDraftMutation();

  const events = eventsData?.data || [];
  const totalPages = eventsData?.total_pages || 1;
  const totalItems = eventsData?.total || 0;
  const pageSize = eventsData?.page_size || 9;

  // Event handlers
  const handleCreateEvent = useCallback(async () => {
    setIsCreatingEvent(true);
    try {
      let finalFormData = { ...formData };
      const accessToken = await getAccessToken();
      if (!accessToken) {
        toast({ title: "Authentication Error", description: "Please log in again.", variant: "destructive" });
        setIsCreatingEvent(false);
        return;
      }

      // Upload thumbnail file if selected
      if (thumbnailFile) {
        const uploadResult = await uploadFile(thumbnailFile, accessToken, "events");
        if (uploadResult.success && uploadResult.file) {
          finalFormData = { ...finalFormData, thumbnail_image_portrait: uploadResult.file.url };
        } else {
          toast({ 
            title: "Upload Failed", 
            description: uploadResult.error || "Failed to upload thumbnail image.", 
            variant: "destructive" 
          });
          setIsCreatingEvent(false);
          return;
        }
      }

      // Upload video file if VOD and video file is selected
      if (formData.is_vod && videoFile) {
        const uploadResult = await uploadMedia(videoFile, accessToken, "events");
        if (uploadResult.success && uploadResult.file) {
          finalFormData = { ...finalFormData, embed: uploadResult.file.url };
        } else {
          toast({ 
            title: "Upload Failed", 
            description: uploadResult.error || "Failed to upload video file.", 
            variant: "destructive" 
          });
          setIsCreatingEvent(false);
          return;
        }
      }

      await createEvent(finalFormData).unwrap();
      toast({ title: "Event Created! 🎉", description: "Your new event is ready to go." });
      setIsCreateDialogOpen(false);
      setFormData(defaultFormValues);
      setVideoFile(null);
      setThumbnailFile(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Something went wrong. Please try again.";
      toast({ title: "Oops!", description: errorMessage, variant: "destructive" });
    } finally {
      setIsCreatingEvent(false);
    }
  }, [createEvent, formData, videoFile, thumbnailFile, getAccessToken, uploadMedia, uploadFile, toast]);

  const handleUpdateEvent = useCallback(async () => {
    if (!selectedEvent) return;
    setIsUpdatingEvent(true);
    try {
      let finalFormData = { ...formData };
      const accessToken = await getAccessToken();
      if (!accessToken) {
        toast({ title: "Authentication Error", description: "Please log in again.", variant: "destructive" });
        setIsUpdatingEvent(false);
        return;
      }

      // Upload thumbnail file if selected
      if (thumbnailFile) {
        const uploadResult = await uploadFile(thumbnailFile, accessToken, "events");
        if (uploadResult.success && uploadResult.file) {
          finalFormData = { ...finalFormData, thumbnail_image_portrait: uploadResult.file.url };
        } else {
          toast({ 
            title: "Upload Failed", 
            description: uploadResult.error || "Failed to upload thumbnail image.", 
            variant: "destructive" 
          });
          setIsUpdatingEvent(false);
          return;
        }
      }

      // Upload video file if VOD and video file is selected
      if (formData.is_vod && videoFile) {
        const uploadResult = await uploadMedia(videoFile, accessToken, "events");
        if (uploadResult.success && uploadResult.file) {
          finalFormData = { ...finalFormData, embed: uploadResult.file.url };
        } else {
          toast({ 
            title: "Upload Failed", 
            description: uploadResult.error || "Failed to upload video file.", 
            variant: "destructive" 
          });
          setIsUpdatingEvent(false);
          return;
        }
      }

      await updateEvent({ id: selectedEvent.id, data: finalFormData as UpdateEventRequest }).unwrap();
      toast({ title: "Event Updated! ✨", description: "Your changes have been saved." });
      setIsEditDialogOpen(false);
      setSelectedEvent(null);
      setFormData(defaultFormValues);
      setVideoFile(null);
      setThumbnailFile(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Couldn't update the event. Please try again.";
      toast({ title: "Oops!", description: errorMessage, variant: "destructive" });
    } finally {
      setIsUpdatingEvent(false);
    }
  }, [updateEvent, selectedEvent, formData, videoFile, thumbnailFile, getAccessToken, uploadMedia, uploadFile, toast]);

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

  const handleArchive = useCallback(async (event: Event) => {
    try {
      await archiveEvent(event.id).unwrap();
      toast({ title: "Event Archived 📦", description: "The event has been archived." });
      setActionMenuOpen(null);
    } catch {
      toast({ title: "Oops!", description: "Couldn't archive the event.", variant: "destructive" });
    }
  }, [archiveEvent, toast]);

  const handleSetDraft = useCallback(async (event: Event) => {
    try {
      await setEventDraft(event.id).unwrap();
      toast({ title: "Event is Draft 📝", description: "The event has been set to draft." });
      setActionMenuOpen(null);
    } catch {
      toast({ title: "Oops!", description: "Couldn't set the event to draft.", variant: "destructive" });
    }
  }, [setEventDraft, toast]);

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
      embed: event.embed || "",
      status: event.status,
      thumbnail_image_portrait: event.thumbnail_image_portrait,
      featured_image: event.featured_image,
      watch_upto: event.watch_upto || "",
      archive_after: event.archive_after || "",
    });
    setVideoFile(null); // Reset video file when opening edit dialog
    setThumbnailFile(null); // Reset thumbnail file when opening edit dialog
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
    setVideoFile(null);
    setThumbnailFile(null);
    setIsCreateDialogOpen(true);
  }, []);

  const closeFormDialog = useCallback(() => {
    setIsCreateDialogOpen(false);
    setIsEditDialogOpen(false);
    setSelectedEvent(null);
    setFormData(defaultFormValues);
    setVideoFile(null);
    setThumbnailFile(null);
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
    videoFile,
    setVideoFile,
    thumbnailFile,
    setThumbnailFile,

    // Data
    events,
    totalPages,
    totalItems,
    pageSize,
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    isCreatingEvent,
    isUpdatingEvent,

    // Actions
    handleCreateEvent,
    handleUpdateEvent,
    handleDeleteEvent,
    handlePublish,
    handleCancel,
    handleComplete,
    handleArchive,
    handleSetDraft,
    openEditDialog,
    openDeleteDialog,
    openCreateDialog,
    closeFormDialog,
    closeDeleteDialog,
  };
}

