import { useState, useMemo } from "react";
import { useTenant } from "@/hooks/useTenant";
import { useGetTicketByIdQuery } from "@/store/api";
import type { PublicEventDetails } from "@/store/api/dashboardApi";

/**
 * Custom hook for VideoPageLayout business logic
 * 
 * BUSINESS LOGIC OVERVIEW:
 * 
 * 1. EVENT SELECTION:
 *    - Manages selected event via day selector (format: "event-{id}")
 *    - Finds selected event from sorted events list
 *    - Falls back to first event if selection is invalid
 * 
 * 2. EVENT SORTING:
 *    - Sorts events by start_datetime (chronological order)
 *    - Ensures consistent event ordering for day selector
 * 
 * 3. EVENT STATUS CHECKS:
 *    - Expired: All events have ended (end_datetime < now)
 *    - Archived: VOD event has passed archive_after date
 *    - Blocked: Geolocation blocking (enforced at purchase time only; not on watch page)
 * 
 * 4. MEDIA SOURCE SELECTION:
 *    - Priority: Event embed > Event watch_link > Default videoSrc
 *    - Thumbnail: Event thumbnail > Default thumbnailSrc
 *    - Embed: Event-specific embed code for third-party players
 * 
 * 5. LIVE CHAT CONFIGURATION:
 *    - Enabled by default unless tenant config disables it
 *    - Respects tenant settings for live chat feature
 */
export function useVideoPageLayout(
  ticketId: string | undefined,
  defaultVideoSrc: string,
  defaultThumbnailSrc: string
) {
  const [selectedDay, setSelectedDay] = useState("");
  const { config, isLoading: isSettingsLoading } = useTenant();

  // Fetch ticket data
  const { data: ticket, isLoading: isTicketLoading } = useGetTicketByIdQuery(
    ticketId ? parseInt(ticketId) : 0,
    { skip: !ticketId }
  );

  const events = ticket?.events || [];

  // Sort events by start_datetime (chronological order)
  const sortedEvents = useMemo(() => {
    return [...events].sort(
      (a, b) =>
        new Date(a.start_datetime).getTime() -
        new Date(b.start_datetime).getTime()
    );
  }, [events]);

  // Find selected event based on selectedDay
  const selectedEvent = useMemo(() => {
    if (!ticketId || !selectedDay.startsWith("event-")) {
      return null;
    }
    const eventId = parseInt(selectedDay.replace("event-", ""));
    return sortedEvents.find((event) => event.id === eventId) || null;
  }, [selectedDay, sortedEvents, ticketId]);

  // Geoblocking is enforced at purchase time only (not during watch)
  // Viewers who already purchased can watch from anywhere
  const isTicketBlocked = false;

  // Check if all events have expired
  const isEventExpired = useMemo(() => {
    if (!events || events.length === 0) return false;
    const now = new Date();
    return events.every((event) => {
      if (event.end_datetime) {
        const endDate = new Date(event.end_datetime);
        return endDate < now;
      }
      return false;
    });
  }, [events]);

  // Get latest end date across all events
  const latestEndDate = useMemo(() => {
    if (!events || events.length === 0) return null;
    const endDates = events
      .map((event) =>
        event.end_datetime ? new Date(event.end_datetime) : null
      )
      .filter((date): date is Date => date !== null);
    if (endDates.length === 0) return null;
    return new Date(Math.max(...endDates.map((d) => d.getTime())));
  }, [events]);

  // Check if selected event is archived (VOD only)
  const isEventArchived = useMemo(() => {
    if (!selectedEvent || !selectedEvent.is_vod || !selectedEvent.archive_after) {
      return false;
    }
    const now = new Date();
    const archiveDate = new Date(selectedEvent.archive_after);
    return archiveDate <= now;
  }, [selectedEvent]);

  // Select media sources based on selected event
  const currentThumbnailSrc =
    selectedEvent?.thumbnail_image_portrait || defaultThumbnailSrc;
  const currentEmbed = selectedEvent?.embed;
  const videoSrcToUse = selectedEvent?.watch_link || defaultVideoSrc;

  // Live chat configuration
  const enableLiveChat = isSettingsLoading
    ? true
    : config?.enable_live_chat ?? true;

  return {
    ticket,
    events,
    sortedEvents,
    selectedDay,
    setSelectedDay,
    selectedEvent,
    isTicketBlocked,
    isEventExpired,
    latestEndDate,
    isEventArchived,
    currentThumbnailSrc,
    currentEmbed,
    videoSrcToUse,
    enableLiveChat,
    isTicketLoading,
    isSettingsLoading,
  };
}

