"use client";

import { IndividualEventCard } from "./IndividualEventCard";

interface Event {
  id: number;
  title: string;
  description?: string;
  start_datetime: string;
  end_datetime: string;
  language?: string;
  location?: string;
  thumbnail_image_portrait?: string;
  featured_image?: string;
}

interface EventsListProps {
  events: Event[];
  ticketUrl: string;
  title?: string;
}

export function EventsList({ events, ticketUrl, title = "Events" }: EventsListProps) {
  if (!events || events.length === 0) {
    return null;
  }

  const sortedEvents = [...events].sort(
    (a, b) =>
      new Date(a.start_datetime).getTime() -
      new Date(b.start_datetime).getTime()
  );

  return (
    <div className="space-y-6 pb-8">
      {title && <h2 className="text-xl font-semibold mb-6 uppercase">{title}</h2>}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full">
        {sortedEvents.map((event) => (
          <IndividualEventCard key={event.id} event={event} ticketUrl={ticketUrl} />
        ))}
      </div>
    </div>
  );
}

