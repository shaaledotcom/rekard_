"use client";

import React, { useEffect } from "react";
import { useGetTicketByIdQuery } from "@/store/api";
import { ArrowLeft } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

interface DaySelectorProps {
  selectedDay: string;
  setSelectedDay: (day: string) => void;
  ticketId?: string;
  ticketUrl: string;
}

interface EventDay {
  id: string;
  label: string;
  event: {
    id: number;
    title: string;
    start_datetime: string;
  };
}

const DaySelector: React.FC<DaySelectorProps> = ({
  selectedDay,
  setSelectedDay,
  ticketId,
  ticketUrl,
}) => {
  const { data: ticket, isLoading } = useGetTicketByIdQuery(
    ticketId ? parseInt(ticketId) : 0,
    { skip: !ticketId }
  );

  const router = useRouter();

  const events = ticket?.events || [];

  const sortedEvents = [...events].sort(
    (a, b) =>
      new Date(a.start_datetime).getTime() -
      new Date(b.start_datetime).getTime()
  );

  const eventDays: EventDay[] = sortedEvents.map((event) => ({
    id: `event-${event.id}`,
    label: event.title,
    event,
  }));

  useEffect(() => {
    if (!selectedDay || !eventDays.find((day) => day.id === selectedDay)) {
      if (eventDays.length > 0 && eventDays[0]?.id) {
        setSelectedDay(eventDays[0].id);
      }
    }

    if (eventDays.length === 1 && eventDays[0]?.id) {
      if (!selectedDay || selectedDay !== eventDays[0].id) {
        setSelectedDay(eventDays[0].id);
      }
    }
  }, [selectedDay, eventDays, setSelectedDay]);

  const handleSelectDay = (dayId: string) => {
    setSelectedDay(dayId);

    const eventId = dayId.replace("event-", "");
    router.replace(`/${ticketUrl}/watch?eventId=${eventId}`, {
      scroll: false,
    });
  };

  if (isLoading) {
    return (
      <div className="mb-4">
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span className="ml-2 text-sm text-muted-foreground">
            Loading events...
          </span>
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="mb-4">
        <div className="text-center py-4 text-muted-foreground">
          No events found for this ticket
        </div>
      </div>
    );
  }

  if (eventDays.length === 0) {
    return (
      <div className="mb-4">
        <div className="text-center py-4 text-muted-foreground">
          No events found for this ticket
        </div>
      </div>
    );
  }

  // Don't show selector for single event
  if (eventDays.length === 1) {
    return null;
  }

  return (
    <div className="mb-4 flex">
      <button
        onClick={() => router.push(`/${ticketUrl}`)}
        className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm pl-0 pr-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-background/50
          }`}
      >
        <ArrowLeft className="w-4 h-4" />

      </button>
      <div className="flex items-center justify-start rounded-md bg-muted p-1 text-muted-foreground overflow-x-auto">
        {eventDays.map((day) => (
          <button
            key={day.id}
            onClick={() => handleSelectDay(day.id)}
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${selectedDay === day.id
              ? "bg-background text-foreground shadow-sm"
              : "hover:bg-background/50"
              }`}
          >
            {day.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default DaySelector;

