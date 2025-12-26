"use client";

import { Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Event } from "@/store/api";
import { EventCard } from "./EventCard";

interface EventsGridProps {
  events: Event[];
  isLoading: boolean;
  onEdit: (event: Event) => void;
  onDelete: (event: Event) => void;
  onCreateClick: () => void;
}

// Loading skeleton component
function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="h-72 rounded-2xl bg-white/5 animate-pulse" />
      ))}
    </div>
  );
}

// Empty state component
function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 animate-in fade-in zoom-in-95 duration-300">
      <div className="w-32 h-32 rounded-full bg-yellow-500/15 flex items-center justify-center mb-6 border-2 border-yellow-500/30">
        <Sparkles className="h-16 w-16 text-yellow-500" />
      </div>
      <h3 className="text-2xl font-bold text-white mb-2">No Events Yet</h3>
      <p className="text-white/50 mb-8 text-center max-w-md">
        Ready to create something amazing? Start by creating your first event and share it with the
        world!
      </p>
      <Button
        onClick={onCreateClick}
        className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-8 py-6 rounded-xl shadow-lg shadow-yellow-500/30"
      >
        <Plus className="h-5 w-5 mr-2" />
        Create Your First Event
      </Button>
    </div>
  );
}

export function EventsGrid({
  events,
  isLoading,
  onEdit,
  onDelete,
  onCreateClick,
}: EventsGridProps) {
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (events.length === 0) {
    return <EmptyState onCreateClick={onCreateClick} />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          onEdit={() => onEdit(event)}
          onDelete={() => onDelete(event)}
        />
      ))}
    </div>
  );
}
