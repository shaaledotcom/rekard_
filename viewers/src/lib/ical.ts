import type { PublicEventDetails } from "@/store/api/dashboardApi";

/**
 * Escapes special characters in iCal text fields according to RFC 5545
 */
function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, "\\\\") // Escape backslashes first
    .replace(/;/g, "\\;") // Escape semicolons
    .replace(/,/g, "\\,") // Escape commas
    .replace(/\n/g, "\\n") // Escape newlines
    .replace(/\r/g, ""); // Remove carriage returns
}

/**
 * Strips HTML tags from text and returns plain text
 */
function stripHtml(html: string): string {
  if (typeof window === "undefined") {
    // Server-side: simple regex-based stripping
    return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
  }
  // Client-side: use DOM parser for better accuracy
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}

/**
 * Formats a date string to iCal format (YYYYMMDDTHHmmssZ)
 */
function formatICalDate(dateString: string): string {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${dateString}`);
  }

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const seconds = String(date.getUTCSeconds()).padStart(2, "0");

  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Generates a unique identifier for the calendar event
 */
function generateUID(eventId: number, timestamp: number): string {
  return `rekard-event-${eventId}-${timestamp}@rekard.app`;
}

/**
 * Generates an iCal file content for an event
 * @param event - The event details
 * @param ticketUrl - Optional URL to the ticket/watch page
 * @returns iCal formatted string
 */
export function generateICalFile(
  event: PublicEventDetails,
  ticketUrl?: string
): string {
  // Validate required fields
  if (!event.start_datetime || !event.end_datetime) {
    throw new Error("Event must have start_datetime and end_datetime");
  }

  if (!event.title) {
    throw new Error("Event must have a title");
  }

  const now = new Date();
  const dtstamp = formatICalDate(now.toISOString());
  const dtstart = formatICalDate(event.start_datetime);
  const dtend = formatICalDate(event.end_datetime);
  const uid = generateUID(event.id, now.getTime());

  // Prepare text fields
  const summary = escapeICalText(event.title);
  const description = event.description
    ? escapeICalText(stripHtml(event.description))
    : "";
  const location = "Online"; // Default location for online events

  // Build iCal content
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Rekard//Event Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:${summary}`,
  ];

  if (description) {
    // iCal DESCRIPTION can be long, but we'll keep it reasonable
    // RFC 5545 allows up to 75 characters per line, but we'll let browsers handle wrapping
    lines.push(`DESCRIPTION:${description}`);
  }

  lines.push(`LOCATION:${location}`);

  if (ticketUrl) {
    // Ensure URL is absolute
    const absoluteUrl =
      ticketUrl.startsWith("http://") || ticketUrl.startsWith("https://")
        ? ticketUrl
        : typeof window !== "undefined"
          ? `${window.location.origin}${ticketUrl.startsWith("/") ? ticketUrl : `/${ticketUrl}`}`
          : ticketUrl;
    lines.push(`URL:${absoluteUrl}`);
  }

  lines.push("END:VEVENT", "END:VCALENDAR");

  return lines.join("\r\n");
}

/**
 * Downloads an iCal file for an event
 * @param event - The event details
 * @param ticketUrl - Optional URL to the ticket/watch page
 * @param filename - Optional custom filename (defaults to event title)
 */
export function downloadICalFile(
  event: PublicEventDetails,
  ticketUrl?: string,
  filename?: string
): void {
  try {
    const icalContent = generateICalFile(event, ticketUrl);
    const blob = new Blob([icalContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = filename || `${event.title.replace(/[^a-z0-9]/gi, "_")}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the object URL
    URL.revokeObjectURL(url);
  } catch (error) {
    throw error;
  }
}

/**
 * Formats a date for URL parameters (YYYYMMDDTHHmmss)
 */
function formatUrlDate(dateString: string): string {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${dateString}`);
  }

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const seconds = String(date.getUTCSeconds()).padStart(2, "0");

  return `${year}${month}${day}T${hours}${minutes}${seconds}`;
}

/**
 * Generates a Google Calendar URL for adding an event
 * @param event - The event details
 * @param ticketUrl - Optional URL to the ticket/watch page
 * @returns Google Calendar URL
 */
export function generateGoogleCalendarUrl(
  event: PublicEventDetails,
  ticketUrl?: string
): string {
  if (!event.start_datetime || !event.end_datetime) {
    throw new Error("Event must have start_datetime and end_datetime");
  }

  if (!event.title) {
    throw new Error("Event must have a title");
  }

  const startDate = formatUrlDate(event.start_datetime);
  const endDate = formatUrlDate(event.end_datetime);
  const description = event.description ? stripHtml(event.description) : "";

  let details = description;
  if (ticketUrl) {
    const absoluteUrl =
      ticketUrl.startsWith("http://") || ticketUrl.startsWith("https://")
        ? ticketUrl
        : typeof window !== "undefined"
          ? `${window.location.origin}${ticketUrl.startsWith("/") ? ticketUrl : `/${ticketUrl}`}`
          : ticketUrl;
    details = details ? `${details}\n\n${absoluteUrl}` : absoluteUrl;
  }

  // URLSearchParams handles encoding — do NOT pre-encode values
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${startDate}Z/${endDate}Z`,
    details: details,
    location: "Online",
    ctz: "UTC",
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generates a Microsoft Outlook/Office 365 Calendar URL for adding an event
 * @param event - The event details
 * @param ticketUrl - Optional URL to the ticket/watch page
 * @returns Microsoft Calendar URL
 */
export function generateMicrosoftCalendarUrl(
  event: PublicEventDetails,
  ticketUrl?: string
): string {
  if (!event.start_datetime || !event.end_datetime) {
    throw new Error("Event must have start_datetime and end_datetime");
  }

  if (!event.title) {
    throw new Error("Event must have a title");
  }

  const startDate = new Date(event.start_datetime);
  const endDate = new Date(event.end_datetime);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    throw new Error("Invalid date format");
  }

  // Format dates for Microsoft Calendar (ISO 8601)
  const startISO = startDate.toISOString();
  const endISO = endDate.toISOString();

  let body = "";
  if (event.description) {
    body = stripHtml(event.description);
  }

  if (ticketUrl) {
    const absoluteUrl =
      ticketUrl.startsWith("http://") || ticketUrl.startsWith("https://")
        ? ticketUrl
        : typeof window !== "undefined"
          ? `${window.location.origin}${ticketUrl.startsWith("/") ? ticketUrl : `/${ticketUrl}`}`
          : ticketUrl;
    body = body ? `${body}\n\n${absoluteUrl}` : absoluteUrl;
  }

  const params = new URLSearchParams({
    subject: event.title,
    startdt: startISO,
    enddt: endISO,
    location: "Online",
  });

  if (body) {
    params.append("body", body);
  }

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}
