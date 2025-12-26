"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface DeleteTicketDialogProps {
  isOpen: boolean;
  ticketTitle: string;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteTicketDialog({
  isOpen,
  ticketTitle,
  isDeleting,
  onClose,
  onConfirm,
}: DeleteTicketDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent onClose={onClose} className="bg-card border-border max-w-md">
        <DialogHeader>
          <div className="mx-auto w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
            <Trash2 className="h-8 w-8 text-red-500" />
          </div>
          <DialogTitle className="text-xl text-foreground text-center">Delete Ticket?</DialogTitle>
          <DialogDescription className="text-muted-foreground text-center">
            Are you sure you want to delete{" "}
            <span className="text-foreground font-medium">{ticketTitle}</span>? This action cannot be
            undone and all associated data will be lost.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="sm:justify-center gap-3">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground hover:bg-secondary/50 flex-1"
          >
            Keep Ticket
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-red-500 hover:bg-red-600 text-white flex-1"
          >
            {isDeleting ? "Deleting..." : "Delete Forever"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

