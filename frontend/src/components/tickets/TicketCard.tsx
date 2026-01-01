"use client";

import { useState } from "react";
import {
  Ticket,
  Globe2,
  Trash2,
  IndianRupee,
  MoreVertical,
  Globe,
  Archive,
  Edit3,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Ticket as TicketType } from "@/store/api";
import { ticketStatusConfig } from "./types";
import { formatPrice, getTicketStatusBackgroundColor } from "./utils";

interface TicketCardProps {
  ticket: TicketType;
  onEdit: () => void;
  onDelete: () => void;
  onPublish?: () => void;
  onArchive?: () => void;
}

export function TicketCard({
  ticket,
  onEdit,
  onDelete,
  onPublish,
  onArchive,
}: TicketCardProps) {
  const [showActions, setShowActions] = useState(false);
  const status = ticketStatusConfig[ticket.status];
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
  const getAvailableActions = (): { label: string; icon: typeof Globe; action: () => void }[] => {
    const actions: { label: string; icon: typeof Globe; action: () => void }[] = [];
    
    if (ticket.status === "draft" && onPublish) {
      actions.push({ label: "Publish", icon: Globe, action: onPublish });
    }
    if (ticket.status !== "archived" && onArchive) {
      actions.push({ label: "Archive", icon: Archive, action: onArchive });
    }
    
    return actions;
  };

  const availableActions = getAvailableActions();

  return (
    <Card 
      onClick={onEdit}
      className="group bg-card border-border rounded-2xl overflow-hidden hover:border-foreground/30 h-full cursor-pointer relative"
    >
      {/* Ticket Image/Color Header */}
      <div className="relative h-36 overflow-hidden">
        {ticket.featured_image ? (
          <img
            src={ticket.featured_image}
            alt={ticket.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className={`w-full h-full ${getTicketStatusBackgroundColor(ticket.status)}`}>
            <div className="absolute inset-0 flex items-center justify-center">
              <Ticket className="h-12 w-12 text-foreground/40" />
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
                <div className="absolute top-full right-0 mt-1 py-1 bg-card border border-border rounded-lg shadow-lg z-50 min-w-[120px]">
                  {availableActions.map((action, i) => (
                    <button
                      key={i}
                      onClick={(e) => handleAction(e, action.action)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
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
      
      {/* Click outside to close */}
      {showActions && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={(e) => { e.stopPropagation(); setShowActions(false); }}
        />
      )}

      <CardContent className="p-5">
        <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-1">
          {ticket.title}
        </h3>

        {/* Price */}
        <div className="flex items-center gap-1.5 text-foreground font-semibold text-sm mb-4">
          <IndianRupee className="h-4 w-4" />
          {formatPrice(ticket.price, ticket.currency)}
        </div>
      </CardContent>
    </Card>
  );
}

