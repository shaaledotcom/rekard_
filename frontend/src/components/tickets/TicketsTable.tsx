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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Ticket as TicketType } from "@/store/api";
import { ticketStatusConfig } from "./types";
import { formatPrice } from "./utils";

interface TicketsTableProps {
  tickets: TicketType[];
  isLoading: boolean;
  onEdit: (ticket: TicketType) => void;
  onDelete: (ticket: TicketType) => void;
  onPublish?: (ticket: TicketType) => void;
  onArchive?: (ticket: TicketType) => void;
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
            <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Price</th>
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
                <div className="h-4 bg-muted/50 rounded animate-pulse w-24" />
              </td>
              <td className="px-6 py-4">
                <div className="h-8 bg-muted/50 rounded animate-pulse w-20" />
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
      <div className="w-32 h-32 rounded-full bg-emerald-500/15 flex items-center justify-center mb-6 border-2 border-emerald-500/30">
        <Ticket className="h-16 w-16 text-emerald-400" />
      </div>
      <h3 className="text-2xl font-bold text-foreground mb-2">No Tickets Yet</h3>
      <p className="text-muted-foreground mb-4 text-center max-w-md">
        Create your first ticket to get started!
      </p>
    </div>
  );
}

function TicketTableRow({
  ticket,
  onEdit,
  onDelete,
  onPublish,
  onArchive,
}: {
  ticket: TicketType;
  onEdit: () => void;
  onDelete: () => void;
  onPublish?: () => void;
  onArchive?: () => void;
}) {
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
    <tr 
      onClick={onEdit}
      className="border-t border-border hover:bg-secondary/30 cursor-pointer transition-colors group"
    >
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          {ticket.featured_image ? (
            <img
              src={ticket.featured_image}
              alt={ticket.title}
              className="w-12 h-12 rounded-lg object-cover"
            />
          ) : (
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center`}>
              <Ticket className="h-6 w-6 text-foreground/40" />
            </div>
          )}
          <div>
            <div className="font-semibold text-foreground">{ticket.title}</div>
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
        <div className="flex items-center gap-1.5 text-foreground font-semibold">
          <IndianRupee className="h-4 w-4" />
          {formatPrice(ticket.price, ticket.currency)}
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          {availableActions.length > 0 && (
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleActionClick}
                className="h-8 w-8 rounded-lg"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
              
              {/* Dropdown Menu */}
              {showActions && (
                <>
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
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={(e) => { e.stopPropagation(); setShowActions(false); }}
                  />
                </>
              )}
            </div>
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

export function TicketsTable({
  tickets,
  isLoading,
  onEdit,
  onDelete,
  onPublish,
  onArchive,
}: TicketsTableProps) {
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (tickets.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden bg-card">
      <table className="w-full">
        <thead className="bg-secondary/50">
          <tr>
            <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Title</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Status</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Price</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Actions</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => (
            <TicketTableRow
              key={ticket.id}
              ticket={ticket}
              onEdit={() => onEdit(ticket)}
              onDelete={() => onDelete(ticket)}
              onPublish={onPublish ? () => onPublish(ticket) : undefined}
              onArchive={onArchive ? () => onArchive(ticket) : undefined}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

