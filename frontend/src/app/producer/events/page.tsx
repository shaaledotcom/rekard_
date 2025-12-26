"use client";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useEventsPage } from "@/hooks/useEventsPage";
import {
  EventsBackground,
  EventsHeader,
  EventsFilters,
  EventsGrid,
  EventsPagination,
  EventFormDialog,
  DeleteEventDialog,
} from "@/components/events";

function EventsContent() {
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
    openEditDialog,
    openDeleteDialog,
    openCreateDialog,
    closeFormDialog,
    closeDeleteDialog,
    handleDeleteEvent,
  } = useEventsPage();

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden">
      <EventsBackground />

      <EventsHeader onCreateClick={openCreateDialog} />

      <main className="container mx-auto px-6 py-8 relative z-10">
        <EventsFilters
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
        />

        <EventsGrid
          events={events}
          isLoading={isLoading}
          onEdit={openEditDialog}
          onDelete={openDeleteDialog}
          onCreateClick={openCreateDialog}
        />

        <EventsPagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </main>

      <EventFormDialog
        isOpen={isCreateDialogOpen || isEditDialogOpen}
        isEditMode={isEditDialogOpen}
        formData={formData}
        isSubmitting={isCreating || isUpdating}
        onClose={closeFormDialog}
        onSubmit={isEditDialogOpen ? handleUpdateEvent : handleCreateEvent}
        onFormChange={setFormData}
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
