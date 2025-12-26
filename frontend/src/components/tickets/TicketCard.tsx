"use client";

import {
  Ticket,
  Globe2,
  Trash2,
  IndianRupee,
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
}

export function TicketCard({
  ticket,
  onEdit,
  onDelete,
}: TicketCardProps) {
  const status = ticketStatusConfig[ticket.status];
  const StatusIcon = status.icon;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  return (
    <Card 
      onClick={onEdit}
      className="group bg-white/[0.03] border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-colors duration-300 h-full cursor-pointer"
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
              <Ticket className="h-12 w-12 text-white/40" />
            </div>
          </div>
        )}
        {/* Overlay */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-[#0a0a0f]/80" />

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
          className="absolute top-3 right-3 h-8 w-8 rounded-lg bg-black/50 hover:bg-red-500/90 text-white/70 hover:text-white opacity-0 group-hover:opacity-100 transition-all duration-200"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <CardContent className="p-5">
        <h3 className="text-lg font-semibold text-white mb-2 line-clamp-1">
          {ticket.title}
        </h3>
        {ticket.description && (
          <p className="text-sm text-white/50 mb-4 line-clamp-2">{ticket.description}</p>
        )}

        {/* Price */}
        <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-sm mb-4">
          <IndianRupee className="h-4 w-4" />
          {formatPrice(ticket.price, ticket.currency)}
        </div>

        {/* Quick Info Pills */}
        <div className="flex items-center gap-2 pt-3 border-t border-white/5 flex-wrap">
          {ticket.geoblocking_enabled && (
            <span className="px-2 py-1 text-xs rounded-lg bg-teal-500/10 text-teal-400 flex items-center gap-1">
              <Globe2 className="h-3 w-3" />
              Geo-locked
            </span>
          )}
          {ticket.events && ticket.events.length > 0 && (
            <span className="px-2 py-1 text-xs rounded-lg bg-emerald-500/10 text-emerald-400">
              {ticket.events.length} event{ticket.events.length > 1 ? "s" : ""}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

