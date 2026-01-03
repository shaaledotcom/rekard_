"use client";

import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { useEventCard } from "@/hooks/useEventCard";

export interface EventCardProps {
  id: number;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  url?: string;
  isLive?: boolean;
  isPurchased?: boolean;
  startDatetime?: string;
  className?: string;
}

export function EventCard({
  id,
  title,
  thumbnailUrl,
  url,
  isPurchased = false,
  startDatetime = "",
}: EventCardProps) {
  const { formattedDate, handleClick } = useEventCard(
    id,
    url,
    isPurchased,
    startDatetime
  );

  return (
    <div className="relative w-full sm:w-auto">
      <div
        className="w-full sm:h-auto p-0 shadow-none rounded-lg cursor-pointer relative"
        onClick={handleClick}
      >
        <div className="p-0 m-0 h-auto flex flex-col shadow-none border-none w-fit">
          {thumbnailUrl ? (
            <Image
              src={thumbnailUrl}
              alt={title}
              className="rounded-lg h-auto"
              loading="lazy"
              width={225}
              height={380}
            />
          ) : (
            <div className="w-[225px] h-[380px] rounded-lg bg-muted flex items-center justify-center">
              <span className="text-muted-foreground text-sm">No Image</span>
            </div>
          )}
        </div>
        <div className="flex flex-col mt-2 sm:mt-3 max-w-[225px]">
          <h3 className="font-medium capitalize text-sm sm:text-xl line-clamp-2 text-primary break-words">
            {title}
          </h3>
          <span className="text-muted-foreground text-xs sm:text-sm">
            {formattedDate}
          </span>
        </div>
      </div>
    </div>
  );
}

export function EventCardSkeleton() {
  return (
    <div className="relative w-full sm:w-auto">
      <Skeleton className="w-[225px] h-[380px] rounded-lg" />
      <div className="flex flex-col mt-2 sm:mt-3 max-w-[225px]">
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}
