"use client";

import { use } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Navbar } from "@/components/layout";
import { TicketsBackground } from "@/components/tickets";
import { TicketForm } from "@/components/tickets/form";
import { useTicketForm } from "@/hooks/useTicketForm";
import { ArrowLeft, Ticket } from "lucide-react";
import Link from "next/link";

interface EditTicketPageProps {
  params: Promise<{ id: string }>;
}

function EditTicketContent({ ticketId }: { ticketId: number }) {
  const {
    initialData,
    isLoading,
    isSubmitting,
    events,
    eventsLoading,
    totalEvents,
    totalEventsPages,
    currentEventsPage,
    eventsSearchQuery,
    onSubmit,
    onCancel,
    onEventsSearch,
    onEventsPageChange,
  } = useTicketForm({ ticketId });

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden">
      <TicketsBackground />
      <Navbar />

      <main className="container mx-auto px-4 lg:px-6 py-8 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/producer/tickets"
            className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Tickets
          </Link>
          
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center">
              <Ticket className="h-6 w-6 text-teal-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Edit Ticket</h1>
              <p className="text-white/50 text-sm">
                Update your ticket configuration
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <TicketForm
          ticketId={ticketId}
          initialData={initialData}
          isLoading={isLoading}
          isSubmitting={isSubmitting}
          events={events}
          eventsLoading={eventsLoading}
          totalEvents={totalEvents}
          totalEventsPages={totalEventsPages}
          currentEventsPage={currentEventsPage}
          eventsSearchQuery={eventsSearchQuery}
          onSubmit={onSubmit}
          onCancel={onCancel}
          onEventsSearch={onEventsSearch}
          onEventsPageChange={onEventsPageChange}
        />
      </main>
    </div>
  );
}

export default function EditTicketPage({ params }: EditTicketPageProps) {
  const resolvedParams = use(params);
  const ticketId = parseInt(resolvedParams.id, 10);

  if (isNaN(ticketId)) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-2">Invalid Ticket ID</h1>
            <p className="text-white/50 mb-4">The ticket ID provided is not valid.</p>
            <Link 
              href="/producer/tickets"
              className="text-emerald-400 hover:text-emerald-300"
            >
              Return to Tickets
            </Link>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <EditTicketContent ticketId={ticketId} />
    </ProtectedRoute>
  );
}

