"use client";

import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventCard, EventCardSkeleton } from "./EventCard";

interface EventSectionProps {
  title: string;
  titleColor?: "default" | "red";
  events: Array<{
    id: number;
    title: string;
    description?: string;
    thumbnail_image_portrait?: string;
    url?: string;
    start_datetime?: string;
  }>;
  showViewAll?: boolean;
  isLoading?: boolean;
  isPurchased?: boolean;
  isLive?: boolean;
}

export function EventSection({
  title,
  titleColor = "default",
  events,
  showViewAll = true,
  isLoading = false,
  isPurchased = false,
  isLive = false,
}: EventSectionProps) {
  const router = useRouter();

  const getTitleColorClass = () => {
    switch (titleColor) {
      case "red":
        return "text-destructive";
      default:
        return "text-foreground";
    }
  };

  const getCategoryFromTitle = (title: string) => {
    const cleanTitle = title.replace(/[🔴\s]/g, "").toLowerCase();
    switch (cleanTitle) {
      case "mypurchases":
        return "my-purchases";
      case "livenow":
        return "live";
      case "upcoming":
        return "upcoming";
      case "on-demand":
        return "on-demand";
      default:
        return "all";
    }
  };

  const handleViewAll = () => {
    const category = getCategoryFromTitle(title);
    router.push(`/events/${category}`);
  };

  if (isLoading) {
    return (
      <section className="w-full py-6 px-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">{title}</h2>
        </div>
        <div className="flex flex-wrap gap-4">
          {[...Array(6)].map((_, i) => (
            <EventCardSkeleton key={i} />
          ))}
        </div>
      </section>
    );
  }

  if (!events || events.length === 0) {
    return null;
  }

  return (
    <section className="w-full py-6 px-0">
      <div className="flex items-center justify-between mb-4">
        <h2 className={`text-xl font-bold ${getTitleColorClass()}`}>{title}</h2>
        {showViewAll && events.length > 6 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
            onClick={handleViewAll}
          >
            View all
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-4">
        {events.slice(0, 6).map((event, index) => (
          <EventCard
            key={event.id || index}
            id={event.id}
            title={event.title}
            thumbnailUrl={event.thumbnail_image_portrait}
            url={event.url}
            isPurchased={isPurchased}
            isLive={isLive}
            startDatetime={event.start_datetime}
          />
        ))}
      </div>
    </section>
  );
}
