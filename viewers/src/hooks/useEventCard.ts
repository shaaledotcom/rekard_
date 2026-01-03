import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTimezoneFormat } from "@/hooks/useTimezoneFormat";

/**
 * Custom hook for EventCard business logic
 * 
 * BUSINESS LOGIC OVERVIEW:
 * 
 * 1. NAVIGATION ROUTING:
 *    - Purchased tickets: Navigate to watch page (`/url/watch` or `/id/watch`)
 *    - Unpurchased tickets: Navigate to ticket details page (`/url` or `/id`)
 *    - URL takes priority over ID for routing
 *    - Prevents duplicate navigation with loading state guard
 * 
 * 2. URL NORMALIZATION:
 *    - Removes leading slashes from URLs for consistent routing
 *    - Falls back to ticket ID if URL is not available
 *    - Validates that at least one identifier (URL or ID) exists
 * 
 * 3. DATE FORMATTING:
 *    - Formats datetime with timezone awareness
 *    - Displays in user-friendly format: "Jan 15, 2024, 10:30 AM"
 *    - Returns empty string if no datetime provided
 * 
 * 4. NAVIGATION STATE:
 *    - Tracks navigation state to prevent double-clicks
 *    - Resets state after navigation completes (success or error)
 */
export function useEventCard(
  id: number,
  url?: string,
  isPurchased: boolean = false,
  startDatetime?: string
) {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const { formatDateTime } = useTimezoneFormat();

  // Format date with timezone awareness
  const formattedDate = startDatetime
    ? formatDateTime(startDatetime, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : "";

  // Handle card click navigation
  const handleClick = async () => {
    if (isNavigating) return;

    setIsNavigating(true);

    try {
      // Normalize URL: remove leading slash and trim
      const cleanUrl = url?.replace(/^\//, "").trim();

      // Determine destination based on purchase status
      // Purchased tickets go to watch page, unpurchased go to details page
      let destination: string;

      if (cleanUrl && cleanUrl !== "") {
        destination = isPurchased ? `/${cleanUrl}/watch` : `/${cleanUrl}`;
      } else if (id) {
        destination = isPurchased ? `/${id}/watch` : `/${id}`;
      } else {
        console.error("No valid URL or ticket ID provided for navigation");
        return;
      }

      router.push(destination);
    } finally {
      setIsNavigating(false);
    }
  };

  return {
    formattedDate,
    isNavigating,
    handleClick,
  };
}

