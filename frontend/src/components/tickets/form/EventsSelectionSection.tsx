"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Calendar, 
  Check, 
  ChevronLeft, 
  ChevronRight,
  CalendarDays,
  AlertCircle
} from "lucide-react";
import type { Event } from "@/store/api";
import type { TicketFormData } from "./types";

interface EventsSelectionSectionProps {
  formData: TicketFormData;
  events: Event[];
  totalEvents: number;
  totalPages: number;
  currentPage: number;
  isLoading: boolean;
  searchQuery: string;
  onChange: (data: Partial<TicketFormData>) => void;
  onSearch: (query: string) => void;
  onPageChange: (page: number) => void;
  isReadOnly?: boolean;
}

export function EventsSelectionSection({
  formData,
  events,
  totalEvents,
  totalPages,
  currentPage,
  isLoading,
  searchQuery,
  onChange,
  onSearch,
  onPageChange,
  isReadOnly = false,
}: EventsSelectionSectionProps) {
  const selectedEventIds = formData.event_ids || [];

  const handleEventToggle = (eventId: number) => {
    if (isReadOnly) return;
    
    const newEventIds = selectedEventIds.includes(eventId)
      ? selectedEventIds.filter((id) => id !== eventId)
      : [...selectedEventIds, eventId];
    
    onChange({ event_ids: newEventIds });
  };

  const handleSelectAll = () => {
    if (isReadOnly) return;
    
    const allEventIds = events.map((e) => e.id);
    const allSelected = allEventIds.every((id) => selectedEventIds.includes(id));
    
    if (allSelected) {
      // Deselect all on current page
      onChange({ 
        event_ids: selectedEventIds.filter((id) => !allEventIds.includes(id)) 
      });
    } else {
      // Select all on current page
      const merged = [...new Set([...selectedEventIds, ...allEventIds])];
      onChange({ event_ids: merged });
    }
  };

  const formatEventDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const allOnPageSelected = events.length > 0 && 
    events.every((e) => selectedEventIds.includes(e.id));

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-white/70 text-sm font-medium">Link to Events *</Label>
          <p className="text-xs text-white/40 mt-1">
            Select the events this ticket provides access to
          </p>
        </div>
        <Badge variant={selectedEventIds.length > 0 ? "default" : "secondary"}>
          {selectedEventIds.length} selected
        </Badge>
      </div>

      {/* Search & Actions */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search events..."
            disabled={isReadOnly}
            className="pl-10 h-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-lg"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleSelectAll}
          disabled={isReadOnly || events.length === 0}
          className="bg-white/5 border-white/20 text-white hover:bg-white/10"
        >
          {allOnPageSelected ? "Deselect All" : "Select All"}
        </Button>
      </div>

      {/* Events List */}
      <div className="border border-white/10 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin h-6 w-6 border-2 border-emerald-500 border-t-transparent rounded-full" />
            <span className="ml-3 text-white/50">Loading events...</span>
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <CalendarDays className="h-12 w-12 text-white/20 mb-3" />
            <p className="text-white/50">No events found</p>
            <p className="text-xs text-white/30 mt-1">
              {searchQuery ? "Try a different search term" : "Create some events first"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {events.map((event) => {
              const isSelected = selectedEventIds.includes(event.id);
              return (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => handleEventToggle(event.id)}
                  disabled={isReadOnly}
                  className={`w-full flex items-center gap-4 p-4 text-left transition-colors ${
                    isSelected 
                      ? "bg-emerald-500/10" 
                      : "hover:bg-white/5"
                  } ${isReadOnly ? "cursor-default" : "cursor-pointer"}`}
                >
                  {/* Checkbox */}
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    isSelected 
                      ? "bg-emerald-500 border-emerald-500" 
                      : "border-white/30"
                  }`}>
                    {isSelected && <Check className="h-3 w-3 text-white" />}
                  </div>

                  {/* Event Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">
                      {event.title || "Untitled Event"}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-3 w-3 text-white/40" />
                      <span className="text-xs text-white/40">
                        {formatEventDate(event.start_datetime)}
                      </span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <Badge 
                    variant={
                      event.status === "live" ? "live" :
                      event.status === "published" ? "published" :
                      event.status === "completed" ? "completed" :
                      "draft"
                    }
                    className="text-xs"
                  >
                    {event.status}
                  </Badge>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-white/40">
            Showing {(currentPage - 1) * 10 + 1} to {Math.min(currentPage * 10, totalEvents)} of {totalEvents}
          </p>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="h-8 w-8 text-white/50"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onPageChange(page)}
                className={`h-8 w-8 ${
                  currentPage === page 
                    ? "bg-emerald-500 text-white" 
                    : "text-white/50 hover:text-white"
                }`}
              >
                {page}
              </Button>
            ))}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="h-8 w-8 text-white/50"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Validation Warning */}
      {selectedEventIds.length === 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <AlertCircle className="h-4 w-4 text-amber-400" />
          <p className="text-xs text-amber-300">
            Please select at least one event for this ticket
          </p>
        </div>
      )}
    </div>
  );
}

