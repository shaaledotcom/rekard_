"use client";

export function useTimezoneFormat() {
  const getTimezone = (): string => {
    if (typeof window === "undefined") return "UTC";
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  };

  const getLocale = (): string => {
    if (typeof window === "undefined") return "en-US";
    return navigator.language || "en-US";
  };

  const formatDate = (
    dateString: string,
    options?: Intl.DateTimeFormatOptions
  ): string => {
    const date = new Date(dateString);
    const timezone = getTimezone();
    const locale = getLocale();

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
  };

  const formatTime = (
    dateString: string,
    options?: Intl.DateTimeFormatOptions
  ): string => {
    const date = new Date(dateString);
    const timezone = getTimezone();
    const locale = getLocale();

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
  };

  const formatDateTime = (
    dateString: string,
    options?: Intl.DateTimeFormatOptions
  ): string => {
    const date = new Date(dateString);
    const timezone = getTimezone();
    const locale = getLocale();

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
  };

  const formatRelativeTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    const timezone = getTimezone();
    const locale = getLocale();

    if (diffInHours < 24) {
      return new Intl.DateTimeFormat(locale, {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: timezone,
      }).format(date);
    } else {
      return new Intl.DateTimeFormat(locale, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: timezone,
      }).format(date);
    }
  };

  return {
    formatDate,
    formatTime,
    formatDateTime,
    formatRelativeTime,
    getTimezone,
    getLocale,
  };
}

