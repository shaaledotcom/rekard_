"use client";

import React, { useState, useRef, useEffect } from "react";
import { Calendar, CalendarPlus, Mail, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  downloadICalFile,
  generateGoogleCalendarUrl,
  generateMicrosoftCalendarUrl,
} from "@/lib/ical";
import type { PublicEventDetails } from "@/store/api/dashboardApi";

interface AddToCalendarButtonProps {
  event: PublicEventDetails;
  ticketUrl?: string;
  className?: string;
}

export function AddToCalendarButton({
  event,
  ticketUrl,
  className,
}: AddToCalendarButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const isDisabled =
    !event.start_datetime || !event.end_datetime || !event.title;

  const handleAction = (action: "google" | "microsoft" | "ical") => {
    try {
      if (!event.start_datetime || !event.end_datetime) {
        toast({
          title: "Error",
          description: "Event dates are missing.",
          variant: "destructive",
        });
        return;
      }

      switch (action) {
        case "google": {
          const url = generateGoogleCalendarUrl(event, ticketUrl);
          window.open(url, "_blank");
          break;
        }
        case "microsoft": {
          const url = generateMicrosoftCalendarUrl(event, ticketUrl);
          window.open(url, "_blank");
          break;
        }
        case "ical":
          downloadICalFile(event, ticketUrl);
          break;
      }

      setIsOpen(false);
    } catch (error) {
      console.error("Failed to add to calendar:", error);
      toast({
        title: "Error",
        description: "Failed to add event to calendar.",
        variant: "destructive",
      });
    }
  };

  if (isDisabled) return null;

  return (
    <div className={`relative ${className || ""}`} ref={dropdownRef}>
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="outline"
        size="sm"
        className="w-full"
      >
        <Calendar className="h-4 w-4" />
        <span>Add to Calendar</span>
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-card border rounded-lg shadow-lg z-50 p-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => handleAction("google")}
              className="flex flex-col items-center gap-1.5 group"
              title="Google Calendar"
            >
              <span className="flex items-center justify-center h-10 w-10 rounded-full border border-border bg-background group-hover:bg-muted transition-colors">
                <CalendarPlus className="h-5 w-5 text-foreground/70 group-hover:text-foreground transition-colors" />
              </span>
              <span className="text-[11px] text-muted-foreground group-hover:text-foreground transition-colors">
                Google
              </span>
            </button>

            <button
              onClick={() => handleAction("microsoft")}
              className="flex flex-col items-center gap-1.5 group"
              title="Outlook Calendar"
            >
              <span className="flex items-center justify-center h-10 w-10 rounded-full border border-border bg-background group-hover:bg-muted transition-colors">
                <Mail className="h-5 w-5 text-foreground/70 group-hover:text-foreground transition-colors" />
              </span>
              <span className="text-[11px] text-muted-foreground group-hover:text-foreground transition-colors">
                Outlook
              </span>
            </button>

            <button
              onClick={() => handleAction("ical")}
              className="flex flex-col items-center gap-1.5 group"
              title="Download .ics file"
            >
              <span className="flex items-center justify-center h-10 w-10 rounded-full border border-border bg-background group-hover:bg-muted transition-colors">
                <Download className="h-5 w-5 text-foreground/70 group-hover:text-foreground transition-colors" />
              </span>
              <span className="text-[11px] text-muted-foreground group-hover:text-foreground transition-colors">
                iCal
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
