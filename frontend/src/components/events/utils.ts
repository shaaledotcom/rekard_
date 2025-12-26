// Format date for display
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

// Format time for display
export const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Format datetime-local input value
export const formatDateTimeLocal = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toISOString().slice(0, 16);
};

// Get background color based on event status
export const getStatusBackgroundColor = (status: string): string => {
  switch (status) {
    case "live":
      return "bg-red-500";
    case "published":
      return "bg-blue-500";
    case "draft":
      return "bg-yellow-500";
    case "completed":
      return "bg-green-500";
    default:
      return "bg-gray-500";
  }
};

