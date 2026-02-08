// iCal generation utility (RFC 5545)

export interface ICalEventOptions {
  title: string;
  description?: string;
  startDatetime: Date;
  endDatetime: Date;
  url?: string;
  uid?: string;
  location?: string;
}

/**
 * Formats a Date to iCal format: YYYYMMDDTHHmmssZ
 */
function formatICalDate(date: Date): string {
  const d = new Date(date);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  const hours = String(d.getUTCHours()).padStart(2, '0');
  const minutes = String(d.getUTCMinutes()).padStart(2, '0');
  const seconds = String(d.getUTCSeconds()).padStart(2, '0');
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Escapes special characters in iCal text fields per RFC 5545
 */
function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '');
}

/**
 * Strips HTML tags from text
 */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
}

/**
 * Generates iCal (RFC 5545) content string for a single event
 */
export function generateICalContent(opts: ICalEventOptions): string {
  const now = new Date();
  const uid = opts.uid || `rekard-${now.getTime()}@rekard.app`;
  const summary = escapeICalText(opts.title);
  const description = opts.description
    ? escapeICalText(stripHtml(opts.description))
    : '';
  const location = opts.location || 'Online';

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Rekard//Event Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatICalDate(now)}`,
    `DTSTART:${formatICalDate(opts.startDatetime)}`,
    `DTEND:${formatICalDate(opts.endDatetime)}`,
    `SUMMARY:${summary}`,
  ];

  if (description) {
    lines.push(`DESCRIPTION:${description}`);
  }

  lines.push(`LOCATION:${location}`);

  if (opts.url) {
    lines.push(`URL:${opts.url}`);
  }

  lines.push('END:VEVENT', 'END:VCALENDAR');

  return lines.join('\r\n');
}

/**
 * Generates iCal content as a Buffer, ready for email attachment
 */
export function generateICalBuffer(opts: ICalEventOptions): Buffer {
  return Buffer.from(generateICalContent(opts), 'utf-8');
}
