"use client";

import { Plus, Sparkles, Ticket } from "lucide-react";
import { motion } from "framer-motion";
import type { Ticket as TicketType } from "@/store/api";
import { TicketCard } from "./TicketCard";

interface TicketsGridProps {
  tickets: TicketType[];
  isLoading: boolean;
  onEdit: (ticket: TicketType) => void;
  onDelete: (ticket: TicketType) => void;
  onCreateClick: () => void;
}

// Loading skeleton component
function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="h-72 rounded-2xl bg-muted/50 animate-pulse" />
      ))}
    </div>
  );
}

// Create New Ticket Card - always first in the grid
function CreateTicketCard({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      className="group relative h-full min-h-[280px] rounded-2xl border-2 border-dashed border-border hover:border-emerald-500/50 bg-gradient-to-br from-muted/30 to-muted/50 hover:from-emerald-500/5 hover:to-emerald-500/10 transition-all duration-300 flex flex-col items-center justify-center gap-4 cursor-pointer overflow-hidden"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Decorative background effects */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl" />
      </div>

      {/* Icon */}
      <div className="relative">
        <div className="absolute inset-0 bg-emerald-500 blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-300" />
        <div className="relative w-16 h-16 rounded-2xl bg-muted/50 group-hover:bg-emerald-500 border border-border group-hover:border-emerald-400 flex items-center justify-center transition-all duration-300 shadow-lg group-hover:shadow-emerald-500/25">
          <Plus className="h-8 w-8 text-muted-foreground group-hover:text-white transition-colors duration-300" />
        </div>
      </div>

      {/* Text */}
      <div className="text-center relative z-10">
        <h3 className="text-lg font-semibold text-muted-foreground group-hover:text-foreground transition-colors duration-300">
          Create New Ticket
        </h3>
        <p className="text-sm text-muted-foreground/70 group-hover:text-muted-foreground mt-1 transition-colors duration-300">
          Click to get started
        </p>
      </div>

      {/* Ticket icon decoration on hover */}
      <Ticket className="absolute top-4 right-4 h-5 w-5 text-transparent group-hover:text-emerald-400 transition-all duration-300" />
    </motion.button>
  );
}

// Empty state component
function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-20 animate-in fade-in zoom-in-95 duration-300">
      <div className="w-32 h-32 rounded-full bg-emerald-500/15 flex items-center justify-center mb-6 border-2 border-emerald-500/30">
        <Sparkles className="h-16 w-16 text-emerald-400" />
      </div>
      <h3 className="text-2xl font-bold text-foreground mb-2">No Tickets Yet</h3>
      <p className="text-muted-foreground mb-4 text-center max-w-md">
        Ready to sell some tickets? Click the card above to create your first ticket!
      </p>
    </div>
  );
}

export function TicketsGrid({
  tickets,
  isLoading,
  onEdit,
  onDelete,
  onCreateClick,
}: TicketsGridProps) {
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Create Ticket Card is always first */}
      <CreateTicketCard onClick={onCreateClick} />
      
      {tickets.length === 0 ? (
        <EmptyState onCreateClick={onCreateClick} />
      ) : (
        tickets.map((ticket) => (
          <TicketCard
            key={ticket.id}
            ticket={ticket}
            onEdit={() => onEdit(ticket)}
            onDelete={() => onDelete(ticket)}
          />
        ))
      )}
    </div>
  );
}

