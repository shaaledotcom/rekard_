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
import { formatDateTimeLocal } from "@/lib/datetime";

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
    return formatDateTimeLocal(dateStr, {
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
          <Label className="text-foreground/70 text-sm font-medium">Link to Events *</Label>
          <p className="text-xs text-muted-foreground mt-1">
            Select the events this ticket provides access to (only published/live events shown)
          </p>
        </div>
        <Badge variant={selectedEventIds.length > 0 ? "default" : "secondary"}>
          {selectedEventIds.length} selected
        </Badge>
      </div>

      {/* Search & Actions */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search events..."
            disabled={isReadOnly}
            className="pl-10 h-10 bg-secondary border-border text-foreground placeholder:text-muted-foreground rounded-lg"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleSelectAll}
          disabled={isReadOnly || events.length === 0}
          className="bg-secondary border-border text-foreground hover:bg-muted"
        >
          {allOnPageSelected ? "Deselect All" : "Select All"}
        </Button>
      </div>

      {/* Events List */}
      <div className="border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="h-6 w-6 border-2 border-foreground border-t-transparent rounded-full" />
            <span className="ml-3 text-muted-foreground">Loading events...</span>
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <CalendarDays className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No events found</p>
            <p className="text-xs text-muted-foreground mt-1">
              {searchQuery ? "Try a different search term" : "Create some events first"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {events.map((event) => {
              const isSelected = selectedEventIds.includes(event.id);
              return (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => handleEventToggle(event.id)}
                  disabled={isReadOnly}
                  className={`w-full flex items-center gap-4 p-4 text-left ${
                    isSelected 
                      ? "bg-secondary" 
                      : "hover:bg-secondary"
                  } ${isReadOnly ? "cursor-default" : "cursor-pointer"}`}
                >
                  {/* Checkbox */}
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    isSelected 
                      ? "bg-foreground border-foreground" 
                      : "border-muted-foreground"
                  }`}>
                    {isSelected && <Check className="h-3 w-3 text-background" />}
                  </div>

                  {/* Event Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {event.title || "Untitled Event"}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
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
          <p className="text-xs text-muted-foreground">
            Showing {(currentPage - 1) * 10 + 1} to {Math.min(currentPage * 10, totalEvents)} of {totalEvents}
          </p>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="h-8 w-8 text-muted-foreground"
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
                    ? "bg-foreground text-background" 
                    : "text-muted-foreground hover:text-foreground"
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
              className="h-8 w-8 text-muted-foreground"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Validation Warning */}
      {selectedEventIds.length === 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary border border-border">
          <AlertCircle className="h-4 w-4 text-foreground" />
          <p className="text-xs text-foreground">
            Please select at least one event for this ticket
          </p>
        </div>
      )}
    </div>
  );
}

