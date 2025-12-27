"use client";

import { useState } from "react";
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
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Event, EventStatus } from "@/store/api";
import { statusConfig } from "./types";
import { formatDate, formatTime, getStatusBackgroundColor } from "./utils";

interface EventCardProps {
  event: Event;
  onEdit: () => void;
  onDelete: () => void;
  onPublish?: () => void;
  onArchive?: () => void;
  onDraft?: () => void;
  onComplete?: () => void;
  onCancel?: () => void;
}

export function EventCard({
  event,
  onEdit,
  onDelete,
  onPublish,
  onArchive,
  onDraft,
  onComplete,
  onCancel,
}: EventCardProps) {
  const [showActions, setShowActions] = useState(false);
  const status = statusConfig[event.status];
  const StatusIcon = status.icon;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

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
    <Card 
      onClick={onEdit}
      className="group bg-card border-border rounded-2xl overflow-hidden hover:border-foreground/30 h-full cursor-pointer relative"
    >
      {/* Event Image/Color Header */}
      <div className="relative h-36 overflow-hidden">
        {event.featured_image ? (
          <img
            src={event.featured_image}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className={`w-full h-full ${getStatusBackgroundColor(event.status)}`}>
            <div className="absolute inset-0 flex items-center justify-center">
              <Video className="h-12 w-12 text-foreground/40" />
            </div>
          </div>
        )}
        {/* Overlay */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-background/80" />

        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <Badge variant={status.variant} className="gap-1.5">
            <StatusIcon className="h-3 w-3" />
            {status.label}
          </Badge>
        </div>

        {/* Action Buttons - shows on hover */}
        <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {availableActions.length > 0 && (
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleActionClick}
                className="h-8 w-8 rounded-lg bg-background/50 hover:bg-foreground/90 text-foreground/70 hover:text-background"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
              
              {/* Dropdown Menu */}
              {showActions && (
                <div className="absolute top-full right-0 mt-1 py-1 bg-card border border-border rounded-lg shadow-lg z-50 min-w-[140px]">
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
              )}
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            className="h-8 w-8 rounded-lg bg-background/50 hover:bg-red-500 text-foreground/70 hover:text-white"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <CardContent className="p-5">
        <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-1">
          {event.title}
        </h3>
        {event.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{event.description}</p>
        )}

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            {formatDate(event.start_datetime)}
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            {formatTime(event.start_datetime)}
          </div>
        </div>

        {/* Quick Info Pills */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
          {event.is_vod && (
            <span className="px-2 py-1 text-xs rounded-lg bg-secondary text-foreground">
              VOD
            </span>
          )}
          <span className="px-2 py-1 text-xs rounded-lg bg-secondary text-muted-foreground flex items-center gap-1">
            <Users className="h-3 w-3" />
            {event.max_concurrent_viewers_per_link}
          </span>
          <span className="px-2 py-1 text-xs rounded-lg bg-secondary text-muted-foreground uppercase">
            {event.language}
          </span>
        </div>
      </CardContent>
      
      {/* Click outside to close */}
      {showActions && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={(e) => { e.stopPropagation(); setShowActions(false); }}
        />
      )}
    </Card>
  );
}
