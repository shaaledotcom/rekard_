import type { TicketStatus } from "@/store/api";

/**
 * Format price with currency symbol
 */
export function formatPrice(price: number, currency: string = "INR"): string {
  const formatted = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);
  // Remove "US" prefix from dollar displays
  return formatted.replace(/US\$/g, "$");
}

import { formatDateLocal } from "@/lib/datetime";

/**
 * Format date to a readable string (converts UTC to local timezone)
 */
export function formatDate(dateString: string): string {
  return formatDateLocal(dateString);
}

/**
 * Get status background color for ticket card header
 */
export function getTicketStatusBackgroundColor(status: TicketStatus): string {
  const colors: Record<TicketStatus, string> = {
    draft: "bg-muted",
    published: "bg-foreground/80",
    sold_out: "bg-muted",
    archived: "bg-muted",
  };
  return colors[status] || colors.draft;
}

/**
 * Calculate availability percentage
 */
export function calculateAvailability(soldQuantity: number, totalQuantity: number): number {
  if (totalQuantity === 0) return 0;
  return Math.round(((totalQuantity - soldQuantity) / totalQuantity) * 100);
}

/**
 * Get availability status text and color
 */
export function getAvailabilityStatus(soldQuantity: number, totalQuantity: number): {
  text: string;
  color: string;
} {
  const available = totalQuantity - soldQuantity;
  const percentage = calculateAvailability(soldQuantity, totalQuantity);

  if (percentage === 0) {
    return { text: "Sold Out", color: "text-foreground" };
  } else if (percentage <= 10) {
    return { text: `Only ${available} left!`, color: "text-foreground" };
  } else if (percentage <= 25) {
    return { text: `${available} remaining`, color: "text-muted-foreground" };
  } else {
    return { text: `${available} available`, color: "text-muted-foreground" };
  }
}

