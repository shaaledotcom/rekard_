"use client";

import { useState } from "react";
import { X, UserPlus, Plus, Trash2, Calendar, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { Ticket as TicketType } from "@/store/api";

interface GrantAccessDialogProps {
  isOpen: boolean;
  tickets: TicketType[];
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (data: { emails: string[]; ticket_ids: number[]; expires_at?: string; notify: boolean }) => void;
}

export function GrantAccessDialog({
  isOpen,
  tickets,
  isSubmitting,
  onClose,
  onSubmit,
}: GrantAccessDialogProps) {
  const [emails, setEmails] = useState<string[]>([""]);
  const [ticketIds, setTicketIds] = useState<number[]>([]);
  const [expiresAt, setExpiresAt] = useState("");
  const [notify, setNotify] = useState(true);

  if (!isOpen) return null;

  const addEmail = () => {
    setEmails([...emails, ""]);
  };

  const removeEmail = (index: number) => {
    if (emails.length > 1) {
      setEmails(emails.filter((_, i) => i !== index));
    }
  };

  const updateEmail = (index: number, value: string) => {
    const newEmails = [...emails];
    newEmails[index] = value;
    setEmails(newEmails);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validEmails = emails.filter((email) => email.trim() !== "");
    if (validEmails.length === 0 || ticketIds.length === 0) return;

    onSubmit({
      emails: validEmails,
      ticket_ids: ticketIds,
      expires_at: expiresAt || undefined,
      notify,
    });
  };

  const toggleTicket = (ticketId: number) => {
    setTicketIds(prev => 
      prev.includes(ticketId) 
        ? prev.filter(id => id !== ticketId)
        : [...prev, ticketId]
    );
  };

  const handleClose = () => {
    setEmails([""]);
    setTicketIds([]);
    setExpiresAt("");
    setNotify(true);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Dialog */}
      <div className="relative w-full max-w-lg mx-4 bg-card border border-border rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-violet-500/10 flex items-center justify-center">
              <UserPlus className="h-5 w-5 text-violet-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Grant Access</h2>
              <p className="text-sm text-muted-foreground">Add users by email</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClose} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Ticket Selection - Multiple Selection */}
          <div className="space-y-2">
            <Label className="text-foreground flex items-center gap-2">
              <Ticket className="h-4 w-4 text-violet-500" />
              Tickets {ticketIds.length > 0 && `(${ticketIds.length} selected)`}
            </Label>
            <div className="max-h-48 overflow-y-auto border border-border rounded-xl bg-secondary/50 p-3 space-y-2">
              {tickets.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No tickets available</p>
              ) : (
                tickets.map((ticket) => (
                  <label
                    key={ticket.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/70 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={ticketIds.includes(ticket.id)}
                      onChange={() => toggleTicket(ticket.id)}
                      className="h-4 w-4 rounded border-border text-violet-600 focus:ring-violet-500"
                    />
                    <span className="text-sm text-foreground flex-1">{ticket.title}</span>
                  </label>
                ))
              )}
            </div>
            {ticketIds.length === 0 && (
              <p className="text-xs text-muted-foreground">Select at least one ticket</p>
            )}
          </div>

          {/* Emails */}
          <div className="space-y-2">
            <Label className="text-foreground">Email Addresses</Label>
            <div className="space-y-2">
              {emails.map((email, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="user@example.com"
                    value={email}
                    onChange={(e) => updateEmail(index, e.target.value)}
                    className="h-11 bg-secondary/50 border-border rounded-xl flex-1"
                    required={index === 0}
                  />
                  {emails.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeEmail(index)}
                      className="h-11 w-11 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addEmail}
              className="mt-2 border-dashed border-violet-500/30 text-violet-600 hover:bg-violet-500/10"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Another Email
            </Button>
          </div>

          {/* Expiration */}
          <div className="space-y-2">
            <Label className="text-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4 text-violet-500" />
              Expires At (Optional)
            </Label>
            <Input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="h-11 bg-secondary/50 border-border rounded-xl"
            />
            <p className="text-xs text-muted-foreground">
              Leave empty for permanent access
            </p>
          </div>

          {/* Notify */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="notify"
              checked={notify}
              onChange={(e) => setNotify(e.target.checked)}
              className="h-4 w-4 rounded border-border text-violet-600 focus:ring-violet-500"
            />
            <Label htmlFor="notify" className="text-sm text-muted-foreground cursor-pointer">
              Send notification email to users
            </Label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || ticketIds.length === 0 || emails.every((e) => !e.trim())}
              className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white"
            >
              {isSubmitting ? "Granting..." : `Grant Access${ticketIds.length > 1 ? ` to ${ticketIds.length} Tickets` : ""}`}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

