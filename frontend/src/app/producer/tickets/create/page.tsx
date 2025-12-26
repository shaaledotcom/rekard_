"use client";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Navbar } from "@/components/layout";
import { TicketsBackground } from "@/components/tickets";
import { TicketForm } from "@/components/tickets/form";
import { useTicketForm } from "@/hooks/useTicketForm";
import { ArrowLeft, Ticket } from "lucide-react";
import Link from "next/link";

function CreateTicketContent() {
  const {
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
  } = useTicketForm();

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
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <Ticket className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Create New Ticket</h1>
              <p className="text-white/50 text-sm">
                Set up a new ticket for your events
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <TicketForm
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

export default function CreateTicketPage() {
  return (
    <ProtectedRoute>
      <CreateTicketContent />
    </ProtectedRoute>
  );
}

