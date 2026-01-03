import { useParams } from "next/navigation";
import { useGetTicketByUrlQuery } from "@/store/api";
import { useCurrencyFormat } from "@/hooks/useCurrencyFormat";
import { useTimezoneFormat } from "@/hooks/useTimezoneFormat";

/**
 * Custom hook for ticket detail page business logic
 * 
 * BUSINESS LOGIC OVERVIEW:
 * 
 * 1. URL NORMALIZATION:
 *    - Ticket URLs from route params may or may not have leading slashes
 *    - Backend API expects URLs with leading slashes for consistency
 *    - We normalize the URL to ensure proper API calls
 * 
 * 2. TICKET DATA FETCHING:
 *    - Fetches ticket details by URL slug (e.g., "/my-event-ticket")
 *    - Skips API call if ticketUrl is not available (prevents unnecessary requests)
 *    - Handles loading and error states for UI feedback
 * 
 * 3. TRAILER MEDIA CONSTRUCTION:
 *    - Business Rule: Featured video takes priority over featured image
 *    - If video exists, it's added first with thumbnail fallback to featured_image
 *    - Featured image is added as secondary media if it exists
 *    - This ensures users see the most engaging content first (video > image)
 * 
 * 4. EVENT INFORMATION CALCULATION:
 *    - LAST DATE: Finds the latest end_datetime across all events
 *      * Business Rule: Shows when the ticket/watch period expires
 *      * Used to display urgency messaging ("LAST DATE TO WATCH")
 *      * Only shown if there are events with valid end dates
 * 
 *    - DATE: Uses the first event's start_datetime
 *      * Business Rule: Primary event date for display purposes
 *      * Formatted as full date string (e.g., "Monday, January 15, 2024")
 * 
 *    - TIME: Extracts time from first event's start_datetime
 *      * Business Rule: Shows when the event starts
 *      * Uses timezone-aware formatting based on tenant/user preferences
 * 
 *    - DURATION: Calculates total duration across all events
 *      * Business Rule: Sums all event durations for cumulative watch time
 *      * Converts milliseconds to hours for readability
 *      * Shows "TBD" if no valid duration data exists
 * 
 *    - PRICE: Formats price with currency symbol
 *      * Business Rule: Respects tenant currency and pricing structure
 *      * Handles different pricing models (fixed, dynamic, etc.)
 * 
 *    - IMAGE: Selects best available image
 *      * Business Rule: Portrait thumbnail preferred, falls back to featured image
 *      * Ensures sidebar always has visual content when available
 * 
 * 5. SHARING FUNCTIONALITY:
 *    - Captures current page URL for social sharing
 *    - Only available in browser context (client-side only)
 *    - Used for social media sharing features
 * 
 * 6. ERROR HANDLING:
 *    - Invalid URL: Shows error if ticketUrl is missing
 *    - Loading State: Shows loading indicator during data fetch
 *    - Error State: Shows error message if API call fails or ticket not found
 */
export function useTicketDetail() {
  const params = useParams();
  const ticketUrl = params.ticketUrl as string;
  const { formatPriceWithCurrency } = useCurrencyFormat();
  const { formatDate, formatTime } = useTimezoneFormat();

  // BUSINESS LOGIC: Normalize URL to ensure backend compatibility
  // Backend expects URLs with leading slashes for consistent routing
  const urlWithSlash = ticketUrl?.startsWith("/") ? ticketUrl : `/${ticketUrl}`;

  // BUSINESS LOGIC: Fetch ticket data with conditional skip
  // Prevents unnecessary API calls when ticketUrl is not available
  const { data: ticket, isLoading, error } = useGetTicketByUrlQuery(urlWithSlash, {
    skip: !ticketUrl,
  });

  // BUSINESS LOGIC: Build trailer media items with priority rules
  // Priority: Featured video > Featured image
  // Video is more engaging, so it's shown first if available
  const trailerMedia = ticket
    ? [
        ...(ticket.featured_video
          ? [
              {
                id: "video",
                type: "video" as const,
                src: ticket.featured_video,
                thumbnail: ticket.featured_image,
              },
            ]
          : []),
        ...(ticket.featured_image
          ? [
              {
                id: "image",
                type: "image" as const,
                src: ticket.featured_image,
                alt: `${ticket.title} featured image`,
              },
            ]
          : []),
      ]
    : [];

  // BUSINESS LOGIC: Calculate event information for sidebar display
  // Aggregates data from multiple events to show comprehensive ticket info
  const eventInfo = ticket
    ? {
        title: ticket.title,
        // BUSINESS LOGIC: Find latest end date across all events
        // This represents when the ticket/watch period expires
        // Used for urgency messaging to encourage purchases
        lastDate:
          ticket.events && ticket.events.length > 0
            ? (() => {
                const latestEndDate = ticket.events.reduce((latest, event) => {
                  if (event.end_datetime) {
                    const eventEndDate = new Date(event.end_datetime);
                    return latest > eventEndDate ? latest : eventEndDate;
                  }
                  return latest;
                }, new Date(0));
                return latestEndDate > new Date(0)
                  ? formatDate(latestEndDate.toISOString(), {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    }).toUpperCase()
                  : "";
              })()
            : "",
        // BUSINESS LOGIC: Use first event's start date as primary date
        // First event typically represents the main event or series start
        date: ticket.events?.[0]?.start_datetime
          ? formatDate(ticket.events[0].start_datetime, {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          : "",
        // BUSINESS LOGIC: Extract time from first event
        // Shows when the event starts, formatted according to user's timezone
        time: ticket.events?.[0]?.start_datetime
          ? formatTime(ticket.events[0].start_datetime)
          : "",
        // BUSINESS LOGIC: Calculate total duration across all events
        // Sums all event durations to show cumulative watch time
        // Helps users understand the total value/content length
        duration:
          ticket.events && ticket.events.length > 0
            ? (() => {
                const totalDuration = ticket.events.reduce((total, event) => {
                  if (event.start_datetime && event.end_datetime) {
                    return (
                      total +
                      (new Date(event.end_datetime).getTime() -
                        new Date(event.start_datetime).getTime())
                    );
                  }
                  return total;
                }, 0);
                return totalDuration > 0
                  ? `${Math.round(totalDuration / (1000 * 60 * 60))} hours`
                  : "TBD";
              })()
            : "TBD",
        // BUSINESS LOGIC: Default language (can be enhanced to use ticket data)
        language: "English",
        // BUSINESS LOGIC: Default location (can be enhanced to use ticket data)
        location: "Online",
        // BUSINESS LOGIC: Format price with currency symbol
        // Respects tenant currency settings and pricing structure
        price: formatPriceWithCurrency(
          ticket.price,
          ticket.currency,
          ticket.pricing,
          ticket.currency
        ),
        // BUSINESS LOGIC: Select best available image
        // Portrait thumbnail preferred for sidebar display, falls back to featured image
        image: ticket.thumbnail_image_portrait || ticket.featured_image || "",
      }
    : null;

  // BUSINESS LOGIC: Get current URL for social sharing
  // Only available in browser context (client-side rendering)
  // Used for social media sharing functionality
  const currentUrl =
    typeof window !== "undefined" ? window.location.href : "";

  return {
    ticketUrl,
    ticket,
    isLoading,
    error,
    trailerMedia,
    eventInfo,
    currentUrl,
  };
}

