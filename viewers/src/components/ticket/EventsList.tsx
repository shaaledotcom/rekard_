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
  title?: string;
}

export function EventsList({ events, title = "Events" }: EventsListProps) {
  if (!events || events.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {title && <h2 className="text-xl font-semibold">{title}</h2>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {events.map((event) => (
          <IndividualEventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}

