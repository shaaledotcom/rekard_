"use client";

import React from "react";
import { CalendarPlus, Mail, Download } from "lucide-react";
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
  const { toast } = useToast();

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

  const iconBtn =
    "flex flex-col items-center gap-1.5 group disabled:opacity-40 disabled:cursor-not-allowed";
  const circle =
    "flex items-center justify-center h-10 w-10 rounded-full border border-border bg-background group-hover:bg-muted transition-colors";
  const icon =
    "h-5 w-5 text-foreground/70 group-hover:text-foreground transition-colors";
  const label =
    "text-[11px] text-muted-foreground group-hover:text-foreground transition-colors";

  return (
    <div className={`flex items-center gap-4 ${className || ""}`}>
      <button
        onClick={() => handleAction("google")}
        className={iconBtn}
        title="Google Calendar"
      >
        <span className={circle}>
          <CalendarPlus className={icon} />
        </span>
        <span className={label}>Google</span>
      </button>

      <button
        onClick={() => handleAction("microsoft")}
        className={iconBtn}
        title="Outlook Calendar"
      >
        <span className={circle}>
          <Mail className={icon} />
        </span>
        <span className={label}>Outlook</span>
      </button>

      <button
        onClick={() => handleAction("ical")}
        className={iconBtn}
        title="Download .ics file"
      >
        <span className={circle}>
          <Download className={icon} />
        </span>
        <span className={label}>iCal</span>
      </button>
    </div>
  );
}
