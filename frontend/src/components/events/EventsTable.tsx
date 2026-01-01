"use client";

import { useState, useRef, useEffect } from "react";
import {
  Calendar,
  Clock,
  Users,
  Video,
  Trash2,
  MoreVertical,
  Globe,
  Archive,
  Edit3,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Event, EventStatus } from "@/store/api";
import { statusConfig } from "./types";
import { formatDate, formatTime, getStatusBackgroundColor } from "./utils";

interface EventsTableProps {
  events: Event[];
  isLoading: boolean;
  onEdit: (event: Event) => void;
  onDelete: (event: Event) => void;
  onPublish?: (event: Event) => void;
  onArchive?: (event: Event) => void;
  onDraft?: (event: Event) => void;
  onComplete?: (event: Event) => void;
  onCancel?: (event: Event) => void;
}

// Loading skeleton component
function LoadingSkeleton() {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <table className="w-full">
        <thead className="bg-secondary/50">
          <tr>
            <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Title</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Status</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Date & Time</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Actions</th>
          </tr>
        </thead>
        <tbody>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <tr key={i} className="border-t border-border">
              <td className="px-6 py-4">
                <div className="h-4 bg-muted/50 rounded animate-pulse w-3/4" />
              </td>
              <td className="px-6 py-4">
                <div className="h-6 bg-muted/50 rounded animate-pulse w-20" />
              </td>
              <td className="px-6 py-4">
                <div className="h-4 bg-muted/50 rounded animate-pulse w-32" />
              </td>
              <td className="px-6 py-4">
                <div className="h-4 bg-muted/50 rounded animate-pulse w-12" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Empty state component
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 animate-in fade-in zoom-in-95 duration-300">
      <div className="w-32 h-32 rounded-full bg-red-500/15 flex items-center justify-center mb-6 border-2 border-red-500/30">
        <Video className="h-16 w-16 text-red-400" />
      </div>
      <h3 className="text-2xl font-bold text-foreground mb-2">No Events Yet</h3>
      <p className="text-muted-foreground mb-4 text-center max-w-md">
        Create your first event to get started!
      </p>
    </div>
  );
}

function EventTableRow({
  event,
  onEdit,
  onDelete,
  onPublish,
  onArchive,
  onDraft,
  onComplete,
  onCancel,
}: {
  event: Event;
  onEdit: () => void;
  onDelete: () => void;
  onPublish?: () => void;
  onArchive?: () => void;
  onDraft?: () => void;
  onComplete?: () => void;
  onCancel?: () => void;
}) {
  const [showActions, setShowActions] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const status = statusConfig[event.status];
  const StatusIcon = status.icon;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  useEffect(() => {
    if (showActions && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right,
      });
    }
  }, [showActions]);

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowActions(!showActions);
  };

  const handleAction = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
    setShowActions(false);
  };

  // Get available actions based on current status
  const getAvailableActions = (): { label: string; icon: typeof Globe; action: () => void; variant?: string }[] => {
    const actions: { label: string; icon: typeof Globe; action: () => void; variant?: string }[] = [];
    
    if (event.status === "draft" && onPublish) {
      actions.push({ label: "Publish", icon: Globe, action: onPublish });
    }
    if (event.status !== "draft" && event.status !== "archived" && onDraft) {
      actions.push({ label: "Set to Draft", icon: Edit3, action: onDraft });
    }
    if ((event.status === "published" || event.status === "live") && onComplete) {
      actions.push({ label: "Mark Completed", icon: CheckCircle, action: onComplete });
    }
    if (event.status !== "archived" && event.status !== "cancelled" && onArchive) {
      actions.push({ label: "Archive", icon: Archive, action: onArchive });
    }
    if (event.status !== "cancelled" && event.status !== "archived" && onCancel) {
      actions.push({ label: "Cancel", icon: XCircle, action: onCancel, variant: "destructive" });
    }
    
    return actions;
  };

  const availableActions = getAvailableActions();

  return (
    <tr 
      onClick={onEdit}
      className="border-t border-border hover:bg-secondary/30 cursor-pointer transition-colors group"
    >
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          {event.featured_image ? (
            <img
              src={event.featured_image}
              alt={event.title}
              className="w-12 h-12 rounded-lg object-cover"
            />
          ) : (
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center`}>
              <Video className="h-6 w-6 text-foreground/40" />
            </div>
          )}
          <div>
            <div className="font-semibold text-foreground">{event.title}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <Badge variant={status.variant} className="gap-1.5">
          <StatusIcon className="h-3 w-3" />
          {status.label}
        </Badge>
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-sm text-foreground">
            <Calendar className="h-3.5 w-3.5" />
            {formatDate(event.start_datetime)}
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            {formatTime(event.start_datetime)}
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          {availableActions.length > 0 && (
            <>
              <Button
                ref={buttonRef}
                variant="ghost"
                size="icon"
                onClick={handleActionClick}
                className="h-8 w-8 rounded-lg"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
              
              {/* Dropdown Menu - positioned outside table */}
              {showActions && (
                <>
                  <div 
                    className="fixed py-1 bg-card border border-border rounded-lg shadow-lg z-50 min-w-[140px]"
                    style={{
                      top: `${dropdownPosition.top}px`,
                      right: `${dropdownPosition.right}px`,
                    }}
                  >
                    {availableActions.map((action, i) => (
                      <button
                        key={i}
                        onClick={(e) => handleAction(e, action.action)}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary transition-colors ${
                          action.variant === "destructive" ? "text-red-500" : "text-foreground"
                        }`}
                      >
                        <action.icon className="h-4 w-4" />
                        {action.label}
                      </button>
                    ))}
                  </div>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={(e) => { e.stopPropagation(); setShowActions(false); }}
                  />
                </>
              )}
            </>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            className="h-8 w-8 rounded-lg hover:bg-red-500/10 hover:text-red-500"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </td>
    </tr>
  );
}

export function EventsTable({
  events,
  isLoading,
  onEdit,
  onDelete,
  onPublish,
  onArchive,
  onDraft,
  onComplete,
  onCancel,
}: EventsTableProps) {
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (events.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden bg-card">
      <table className="w-full">
        <thead className="bg-secondary/50">
          <tr>
            <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Title</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Status</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Date & Time</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Actions</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <EventTableRow
              key={event.id}
              event={event}
              onEdit={() => onEdit(event)}
              onDelete={() => onDelete(event)}
              onPublish={onPublish ? () => onPublish(event) : undefined}
              onArchive={onArchive ? () => onArchive(event) : undefined}
              onDraft={onDraft ? () => onDraft(event) : undefined}
              onComplete={onComplete ? () => onComplete(event) : undefined}
              onCancel={onCancel ? () => onCancel(event) : undefined}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

