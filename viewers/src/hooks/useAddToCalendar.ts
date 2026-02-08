import { useState, useRef, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  downloadICalFile,
  generateGoogleCalendarUrl,
  generateMicrosoftCalendarUrl,
} from "@/lib/ical";
import type { PublicEventDetails } from "@/store/api/dashboardApi";

/**
 * Custom hook for Add to Calendar business logic
 *
 * BUSINESS LOGIC OVERVIEW:
 *
 * 1. DROPDOWN STATE:
 *    - Manages open/close state of the calendar dropdown
 *    - Handles click-outside to dismiss
 *
 * 2. VALIDATION:
 *    - Checks that event has required fields (title, start_datetime, end_datetime)
 *    - Disables interaction when data is incomplete
 *
 * 3. CALENDAR ACTIONS:
 *    - Google Calendar: Generates URL and opens in new tab
 *    - Microsoft Outlook: Generates URL and opens in new tab
 *    - iCal (.ics): Generates file and triggers download
 *
 * 4. ERROR HANDLING:
 *    - Shows toast on missing dates or generation failure
 */
export function useAddToCalendar(
  event: PublicEventDetails,
  ticketUrl?: string
) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const isDisabled =
    !event.start_datetime || !event.end_datetime || !event.title;

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

  const toggleOpen = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleAction = useCallback(
    (action: "google" | "microsoft" | "ical") => {
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
    },
    [event, ticketUrl, toast]
  );

  return {
    isOpen,
    isDisabled,
    dropdownRef,
    toggleOpen,
    handleAction,
  };
}
