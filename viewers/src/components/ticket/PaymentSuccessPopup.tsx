"use client";

import React from "react";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PaymentSuccessPopupProps {
  isOpen: boolean;
  onClose: () => void;
  eventTitle: string;
  orderId?: number;
}

export function PaymentSuccessPopup({
  isOpen,
  onClose,
  eventTitle,
  orderId,
}: PaymentSuccessPopupProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            Payment Successful!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Your ticket has been purchased successfully
            </p>
            <div className="bg-muted rounded-lg p-3">
              <p className="font-medium text-sm">{eventTitle}</p>
              {orderId && (
                <p className="text-xs text-muted-foreground mt-1">
                  Order ID: {orderId}
                </p>
              )}
            </div>
          </div>

          <Button className="w-full" onClick={onClose}>
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

