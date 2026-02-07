"use client";

import Image from "next/image";
import { useTimezoneFormat } from "@/hooks/useTimezoneFormat";
import { useRouter } from "next/navigation";

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
  ticketUrl: string;
}

export function IndividualEventCard({ event, ticketUrl }: IndividualEventCardProps) {
  const { formatDate, formatTime } = useTimezoneFormat();
  const router = useRouter();

  const imageUrl =
    event.thumbnail_image_portrait ||
    event.featured_image ||
    "/placeholder-event.jpg";

  const watchPath = `/${ticketUrl}/watch`;
  const handleClick = () => {
    router.push(`${watchPath}?eventId=${event.id}`);
  };

  return (
    <div
      onClick={handleClick}
      className="cursor-pointer group w-full"
    >
      <div className="relative w-full aspect-[3/5] rounded-lg overflow-hidden bg-muted">
        <Image
          src={imageUrl}
          alt={event.title}
          fill
          loading="lazy"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          sizes="(max-width: 640px) 45vw,
                 (max-width: 1024px) 30vw,
                 225px"
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

