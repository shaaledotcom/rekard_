import { formatDateLocal, formatTimeLocal, utcToLocalInput } from "@/lib/datetime";

// Format date for display (converts UTC to local timezone)
export const formatDate = (dateString: string): string => {
  return formatDateLocal(dateString, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

// Format time for display (converts UTC to local timezone)
export const formatTime = (dateString: string): string => {
  return formatTimeLocal(dateString);
};

// Format datetime-local input value (converts UTC to local for input field)
export const formatDateTimeLocal = (dateString: string): string => {
  return utcToLocalInput(dateString);
};

// Get background color based on event status
export const getStatusBackgroundColor = (status: string): string => {
  switch (status) {
    case "live":
      return "bg-foreground";
    case "published":
      return "bg-foreground/80";
    case "draft":
      return "bg-muted";
    case "completed":
      return "bg-muted";
    case "archived":
      return "bg-muted/50";
    case "cancelled":
      return "bg-muted/50";
    default:
      return "bg-muted";
  }
};

