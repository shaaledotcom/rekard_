"use client";

import { Mail, Ticket, Calendar, MoreVertical, Ban, Trash2, CheckCircle, Clock, XCircle, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ViewerAccess, ViewerAccessStatus } from "@/store/api";
import { useState } from "react";

interface ViewersTableProps {
  accessGrants: ViewerAccess[];
  isLoading: boolean;
  onRevoke: (grant: ViewerAccess) => void;
  onDelete: (grant: ViewerAccess) => void;
}

const statusConfig: Record<ViewerAccessStatus, { label: string; icon: React.ReactNode; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "Active", icon: <CheckCircle className="h-3.5 w-3.5" />, variant: "default" },
  used: { label: "Used", icon: <UserCheck className="h-3.5 w-3.5" />, variant: "secondary" },
  expired: { label: "Expired", icon: <Clock className="h-3.5 w-3.5" />, variant: "outline" },
  revoked: { label: "Revoked", icon: <XCircle className="h-3.5 w-3.5" />, variant: "destructive" },
};

function AccessGrantRow({ 
  grant, 
  onRevoke, 
  onDelete 
}: { 
  grant: ViewerAccess; 
  onRevoke: (grant: ViewerAccess) => void;
  onDelete: (grant: ViewerAccess) => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const status = statusConfig[grant.status];

  return (
    <tr className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-violet-500/10 flex items-center justify-center">
            <Mail className="h-5 w-5 text-violet-500" />
          </div>
          <div>
            <p className="font-medium text-foreground">{grant.email}</p>
            {grant.has_signed_up && (
              <p className="text-xs text-emerald-500 flex items-center gap-1">
                <UserCheck className="h-3 w-3" /> Signed up
              </p>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-2">
          <Ticket className="h-4 w-4 text-muted-foreground" />
          <span className="text-foreground">{grant.ticket_title || `Ticket #${grant.ticket_id}`}</span>
        </div>
      </td>
      <td className="px-4 py-4">
        <Badge variant={status.variant} className="gap-1.5">
          {status.icon}
          {status.label}
        </Badge>
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span className="text-sm">
            {new Date(grant.granted_at).toLocaleDateString()}
          </span>
        </div>
      </td>
      <td className="px-4 py-4">
        {grant.expires_at ? (
          <span className="text-sm text-muted-foreground">
            {new Date(grant.expires_at).toLocaleDateString()}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">Never</span>
        )}
      </td>
      <td className="px-4 py-4">
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setShowMenu(!showMenu)}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
          {showMenu && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowMenu(false)} 
              />
              <div className="absolute right-0 top-full mt-1 z-20 w-40 bg-popover border border-border rounded-lg shadow-lg py-1">
                {grant.status === "active" && (
                  <button
                    onClick={() => { onRevoke(grant); setShowMenu(false); }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-secondary/50 flex items-center gap-2 text-orange-500"
                  >
                    <Ban className="h-4 w-4" />
                    Revoke Access
                  </button>
                )}
                <button
                  onClick={() => { onDelete(grant); setShowMenu(false); }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-secondary/50 flex items-center gap-2 text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

export function ViewersTable({ accessGrants, isLoading, onRevoke, onDelete }: ViewersTableProps) {
  if (isLoading) {
    return (
      <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl overflow-hidden">
        <div className="animate-pulse p-8">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-4 mb-4">
              <div className="h-10 w-10 bg-secondary rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-secondary rounded w-1/4" />
                <div className="h-3 bg-secondary rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (accessGrants.length === 0) {
    return (
      <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-12 text-center">
        <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-violet-500/10 flex items-center justify-center">
          <Mail className="h-8 w-8 text-violet-500" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">No access grants yet</h3>
        <p className="text-muted-foreground mb-4">
          Grant access to viewers by email so they can access your tickets without purchasing.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50 bg-secondary/30">
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Email</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Ticket</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Granted</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Expires</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {accessGrants.map((grant) => (
              <AccessGrantRow 
                key={grant.id} 
                grant={grant} 
                onRevoke={onRevoke}
                onDelete={onDelete}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

