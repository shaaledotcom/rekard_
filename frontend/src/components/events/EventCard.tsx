"use client";

import {
  Calendar,
  Clock,
  Users,
  Video,
  Trash2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Event } from "@/store/api";
import { statusConfig } from "./types";
import { formatDate, formatTime, getStatusBackgroundColor } from "./utils";

interface EventCardProps {
  event: Event;
  onEdit: () => void;
  onDelete: () => void;
}

export function EventCard({
  event,
  onEdit,
  onDelete,
}: EventCardProps) {
  const status = statusConfig[event.status];
  const StatusIcon = status.icon;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  return (
    <Card 
      onClick={onEdit}
      className="group bg-card border-border rounded-2xl overflow-hidden hover:border-foreground/30 h-full cursor-pointer"
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

        {/* Delete Button - shows on hover */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDelete}
          className="absolute top-3 right-3 h-8 w-8 rounded-lg bg-background/50 hover:bg-foreground/90 text-foreground/70 hover:text-background opacity-0 group-hover:opacity-100"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
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
    </Card>
  );
}
