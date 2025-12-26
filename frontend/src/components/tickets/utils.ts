import type { TicketStatus } from "@/store/api";

/**
 * Format price with currency symbol
 */
export function formatPrice(price: number, currency: string = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);
}

/**
 * Format date to a readable string
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Get status background color for ticket card header
 */
export function getTicketStatusBackgroundColor(status: TicketStatus): string {
  const colors: Record<TicketStatus, string> = {
    draft: "bg-gradient-to-br from-yellow-600/80 to-amber-700/80",
    published: "bg-gradient-to-br from-emerald-600/80 to-teal-700/80",
    sold_out: "bg-gradient-to-br from-orange-600/80 to-red-700/80",
    archived: "bg-gradient-to-br from-slate-600/80 to-gray-700/80",
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
    return { text: "Sold Out", color: "text-red-400" };
  } else if (percentage <= 10) {
    return { text: `Only ${available} left!`, color: "text-orange-400" };
  } else if (percentage <= 25) {
    return { text: `${available} remaining`, color: "text-yellow-400" };
  } else {
    return { text: `${available} available`, color: "text-green-400" };
  }
}

