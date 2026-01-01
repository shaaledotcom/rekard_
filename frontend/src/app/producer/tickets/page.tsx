"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Navbar } from "@/components/layout";
import { useToast } from "@/hooks/use-toast";
import {
  useGetTicketsQuery,
  useDeleteTicketMutation,
  usePublishTicketMutation,
  useArchiveTicketMutation,
  Ticket,
  TicketStatus,
} from "@/store/api";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  TicketsBackground,
  TicketsFilters,
  TicketsGrid,
  TicketsTable,
  TicketsPagination,
  DeleteTicketDialog,
  type ViewMode,
} from "@/components/tickets";

function TicketsContent() {
  const router = useRouter();
  const { toast } = useToast();

  // UI state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "">("");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  // API hooks
  const { data: ticketsData, isLoading } = useGetTicketsQuery({
    page,
    page_size: 9,
    status: statusFilter || undefined,
    search: search || undefined,
    sort_by: "created_at",
    sort_order: "desc",
  });

  const [deleteTicket, { isLoading: isDeleting }] = useDeleteTicketMutation();
  const [publishTicket] = usePublishTicketMutation();
  const [archiveTicket] = useArchiveTicketMutation();

  const tickets = ticketsData?.data || [];
  const totalPages = ticketsData?.total_pages || 1;
  const totalItems = ticketsData?.total || 0;
  const pageSize = ticketsData?.page_size || 9;

  // Navigation handlers
  const handleCreateClick = useCallback(() => {
    router.push("/producer/tickets/create");
  }, [router]);

  const handleEditClick = useCallback((ticket: Ticket) => {
    router.push(`/producer/tickets/${ticket.id}`);
  }, [router]);

  const handleDeleteClick = useCallback((ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!selectedTicket) return;
    
    try {
      await deleteTicket(selectedTicket.id).unwrap();
      toast({
        title: "Ticket Deleted",
        description: "The ticket has been removed successfully.",
      });
      setIsDeleteDialogOpen(false);
      setSelectedTicket(null);
    } catch {
      toast({
        title: "Oops!",
        description: "Couldn't delete the ticket. Please try again.",
        variant: "destructive",
      });
    }
  }, [deleteTicket, selectedTicket, toast]);

  const handleDeleteCancel = useCallback(() => {
    setIsDeleteDialogOpen(false);
    setSelectedTicket(null);
  }, []);

  const handlePublish = useCallback(async (ticket: Ticket) => {
    try {
      await publishTicket(ticket.id).unwrap();
      toast({
        title: "Ticket Published! 🎫",
        description: "The ticket is now available for purchase.",
      });
    } catch {
      toast({
        title: "Oops!",
        description: "Couldn't publish the ticket. Please try again.",
        variant: "destructive",
      });
    }
  }, [publishTicket, toast]);

  const handleArchive = useCallback(async (ticket: Ticket) => {
    try {
      await archiveTicket(ticket.id).unwrap();
      toast({
        title: "Ticket Archived 📦",
        description: "The ticket has been archived.",
      });
    } catch {
      toast({
        title: "Oops!",
        description: "Couldn't archive the ticket. Please try again.",
        variant: "destructive",
      });
    }
  }, [archiveTicket, toast]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <TicketsBackground />

      <Navbar />

      <main className="container mx-auto px-4 lg:px-6 py-8 relative z-10">
        <TicketsFilters
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {viewMode === "grid" ? (
          <TicketsGrid
            tickets={tickets}
            isLoading={isLoading}
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
            onCreateClick={handleCreateClick}
            onPublish={handlePublish}
            onArchive={handleArchive}
          />
        ) : (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={handleCreateClick} className="gap-2">
                <Plus className="h-4 w-4" />
                Create New Ticket
              </Button>
            </div>
            <TicketsTable
              tickets={tickets}
              isLoading={isLoading}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
              onPublish={handlePublish}
              onArchive={handleArchive}
            />
          </div>
        )}

        <TicketsPagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      </main>

      {/* Only Delete Dialog remains - Create/Edit are full pages now */}
      <DeleteTicketDialog
        isOpen={isDeleteDialogOpen}
        ticketTitle={selectedTicket?.title || ""}
        isDeleting={isDeleting}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}

export default function ProducerTicketsPage() {
  return (
    <ProtectedRoute>
      <TicketsContent />
    </ProtectedRoute>
  );
}
