/**
 * Datetime utility functions for consistent timezone handling across the platform
 * 
 * Key principles:
 * - Store dates in UTC in the database
 * - Convert local time to UTC when saving
 * - Convert UTC to local time when displaying
 */

/**
 * Get user's timezone
 */
export function getUserTimezone(): string {
  if (typeof window === "undefined") return "UTC";
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Get user's locale
 */
export function getUserLocale(): string {
  if (typeof window === "undefined") return "en-US";
  return navigator.language || "en-US";
}

/**
 * Convert a datetime-local input value (local time) to UTC ISO string
 * This is used when saving dates from forms
 * 
 * @param localDateTimeString - Value from datetime-local input (e.g., "2024-01-01T10:00")
 * @returns ISO string in UTC (e.g., "2024-01-01T10:00:00.000Z")
 */
export function localToUTC(localDateTimeString: string): string {
  if (!localDateTimeString) return "";
  
  // datetime-local input gives us a string like "2024-01-01T10:00"
  // JavaScript's Date constructor interprets this as local time
  const localDate = new Date(localDateTimeString);
  
  // Convert to UTC ISO string
  return localDate.toISOString();
}

/**
 * Convert UTC ISO string to datetime-local input value (local time)
 * This is used when populating datetime-local inputs in forms
 * 
 * @param utcISOString - ISO string in UTC (e.g., "2024-01-01T10:00:00.000Z")
 * @returns datetime-local format string (e.g., "2024-01-01T10:00")
 */
export function utcToLocalInput(utcISOString: string): string {
  if (!utcISOString) return "";
  
  const utcDate = new Date(utcISOString);
  
  // Get local date components
  const year = utcDate.getFullYear();
  const month = String(utcDate.getMonth() + 1).padStart(2, "0");
  const day = String(utcDate.getDate()).padStart(2, "0");
  const hours = String(utcDate.getHours()).padStart(2, "0");
  const minutes = String(utcDate.getMinutes()).padStart(2, "0");
  
  // Return in datetime-local format: YYYY-MM-DDTHH:mm
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Format UTC date string to local date for display
 * 
 * @param utcISOString - ISO string in UTC
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string in user's local timezone
 */
export function formatDateLocal(
  utcISOString: string,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!utcISOString) return "";
  
  const date = new Date(utcISOString);
  const timezone = getUserTimezone();
  const locale = getUserLocale();
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...options,
  };
  
  return new Intl.DateTimeFormat(locale, {
    ...defaultOptions,
    timeZone: timezone,
  }).format(date);
}

/**
 * Format UTC time string to local time for display
 * 
 * @param utcISOString - ISO string in UTC
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted time string in user's local timezone
 */
export function formatTimeLocal(
  utcISOString: string,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!utcISOString) return "";
  
  const date = new Date(utcISOString);
  const timezone = getUserTimezone();
  const locale = getUserLocale();
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    ...options,
  };
  
  return new Intl.DateTimeFormat(locale, {
    ...defaultOptions,
    timeZone: timezone,
  }).format(date);
}

/**
 * Format UTC datetime string to local datetime for display
 * 
 * @param utcISOString - ISO string in UTC
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted datetime string in user's local timezone
 */
export function formatDateTimeLocal(
  utcISOString: string,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!utcISOString) return "";
  
  const date = new Date(utcISOString);
  const timezone = getUserTimezone();
  const locale = getUserLocale();
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    ...options,
  };
  
  return new Intl.DateTimeFormat(locale, {
    ...defaultOptions,
    timeZone: timezone,
  }).format(date);
}

