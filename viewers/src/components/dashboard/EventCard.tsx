"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

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
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleClick = async () => {
    if (isNavigating) return;

    setIsNavigating(true);

    try {
      const cleanUrl = url?.replace(/^\//, "").trim();

      if (cleanUrl && cleanUrl !== "") {
        // If purchased, navigate to watch page; otherwise, navigate to ticket details
        const destination = isPurchased ? `/${cleanUrl}/watch` : `/${cleanUrl}`;
        router.push(destination);
      } else if (id) {
        // If purchased, navigate to watch page; otherwise, navigate to ticket details
        const destination = isPurchased ? `/${id}/watch` : `/${id}`;
        router.push(destination);
      } else {
        console.error("No valid URL or ticket ID provided for navigation");
      }
    } finally {
      setIsNavigating(false);
    }
  };

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
            {startDatetime ? formatDate(startDatetime) : ""}
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
