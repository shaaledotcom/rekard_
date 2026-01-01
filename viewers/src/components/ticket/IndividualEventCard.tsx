"use client";

import Image from "next/image";
import { useTimezoneFormat } from "@/hooks/useTimezoneFormat";

interface IndividualEventCardProps {
  event: {
    id: number;
    title: string;
    description?: string;
    start_datetime: string;
    end_datetime: string;
    language?: string;
    location?: string;
    thumbnail_image_portrait?: string;
    featured_image?: string;
  };
}

export function IndividualEventCard({ event }: IndividualEventCardProps) {
  const { formatDate, formatTime } = useTimezoneFormat();

  const imageUrl =
    event.thumbnail_image_portrait ||
    event.featured_image ||
    "/placeholder-event.jpg";

  return (
    <div className="w-full h-auto p-0 m-0 shadow-none rounded-lg">
      <div className="p-0 m-0 w-full aspect-[2/3] flex flex-col shadow-none border-none">
        <Image
          src={imageUrl}
          alt={event.title}
          className="w-full h-full object-cover rounded-lg"
          loading="lazy"
          width={300}
          height={400}
        />
      </div>
      <div className="flex mt-3">
        <h3 className="font-medium text-left text-xl truncate text-primary w-full capitalize">
          {event.title}
        </h3>
      </div>
      <div className="mt-2 space-y-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2 text-xs">
          <span>
            {formatDate(event.start_datetime)} {formatTime(event.start_datetime)}{" "}
            - {formatDate(event.end_datetime)} {formatTime(event.end_datetime)}
          </span>
        </div>
      </div>
    </div>
  );
}

