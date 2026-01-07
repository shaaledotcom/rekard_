"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Navbar } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { useEventsPage } from "@/hooks/useEventsPage";
import {
  EventsBackground,
  EventsFilters,
  EventsGrid,
  EventsTable,
  EventsPagination,
  EventFormDialog,
  DeleteEventDialog,
  type ViewMode,
} from "@/components/events";

function EventsContent() {
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  const {
    // UI state
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    page,
    setPage,

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
    openEditDialog,
    openDeleteDialog,
    openCreateDialog,
    closeFormDialog,
    closeDeleteDialog,
    handleDeleteEvent,
    handlePublish,
    handleCancel,
    handleComplete,
    handleArchive,
    handleSetDraft,
  } = useEventsPage();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <EventsBackground />

      <Navbar />

      <main className="container mx-auto px-4 lg:px-6 py-8 relative z-10">
        <EventsFilters
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {viewMode === "grid" ? (
          <EventsGrid
            events={events}
            isLoading={isLoading}
            onEdit={openEditDialog}
            onDelete={openDeleteDialog}
            onCreateClick={openCreateDialog}
            onPublish={handlePublish}
            onArchive={handleArchive}
            onDraft={handleSetDraft}
            onComplete={handleComplete}
            onCancel={handleCancel}
          />
        ) : (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={openCreateDialog} className="gap-2">
                <Plus className="h-4 w-4" />
                Create New Event
              </Button>
            </div>
            <EventsTable
              events={events}
              isLoading={isLoading}
              onEdit={openEditDialog}
              onDelete={openDeleteDialog}
              onPublish={handlePublish}
              onArchive={handleArchive}
              onDraft={handleSetDraft}
              onComplete={handleComplete}
              onCancel={handleCancel}
            />
          </div>
        )}

        <EventsPagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      </main>

      <EventFormDialog
        isOpen={isCreateDialogOpen || isEditDialogOpen}
        isEditMode={isEditDialogOpen}
        formData={formData}
        isSubmitting={isCreatingEvent || isUpdatingEvent}
        onClose={closeFormDialog}
        onSubmit={isEditDialogOpen ? handleUpdateEvent : handleCreateEvent}
        onFormChange={setFormData}
        videoFile={videoFile}
        onVideoFileChange={setVideoFile}
        thumbnailFile={thumbnailFile}
        onThumbnailFileChange={setThumbnailFile}
      />

      <DeleteEventDialog
        isOpen={isDeleteDialogOpen}
        eventTitle={selectedEvent?.title || ""}
        isDeleting={isDeleting}
        onClose={closeDeleteDialog}
        onConfirm={handleDeleteEvent}
      />
    </div>
  );
}

export default function ProducerEventsPage() {
  return (
    <ProtectedRoute>
      <EventsContent />
    </ProtectedRoute>
  );
}
