"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTenant } from "@/hooks/useTenant";
import { cn } from "@/lib/utils";

export function FeaturedCarousel() {
  const { config, isLoading } = useTenant();
  const [currentIndex, setCurrentIndex] = useState(0);

  const featuredImages = config?.featured_images || [];
  const hasFeaturedImages = featuredImages.length > 0;

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % featuredImages.length);
  }, [featuredImages.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex(
      (prev) => (prev - 1 + featuredImages.length) % featuredImages.length
    );
  }, [featuredImages.length]);

  // Auto-advance slides
  useEffect(() => {
    if (featuredImages.length <= 1) return;
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [nextSlide, featuredImages.length]);

  const handleImageClick = useCallback(
    (image: { url: string; link?: string }) => {
      if (image.link) {
        window.open(image.link, "_blank", "noopener,noreferrer");
      }
    },
    []
  );

  if (isLoading) {
    return (
      <section className="w-full mb-8">
        <Skeleton className="w-full aspect-[16/5] rounded-xl" />
      </section>
    );
  }

  if (!hasFeaturedImages) {
    return null;
  }

  const currentImage = featuredImages[currentIndex];
  const hasLink = currentImage?.link;

  return (
    <section className="w-full mb-8">
      <div className="relative">
        <div className="relative rounded-xl overflow-hidden bg-muted">
          <div className="aspect-[16/9] sm:aspect-[16/5] relative">
            <Image
              src={currentImage?.url || ""}
              alt={currentImage?.alt || `Featured ${currentIndex + 1}`}
              fill
              className={cn(
                "object-cover transition-opacity duration-500",
                hasLink && "cursor-pointer hover:opacity-90"
              )}
              onClick={() => handleImageClick(currentImage)}
              priority
            />
          </div>

          {/* Navigation arrows */}
          {featuredImages.length > 1 && (
            <>
              <Button
                size="icon"
                variant="secondary"
                className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 text-white border-0"
                onClick={prevSlide}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>

              <Button
                size="icon"
                variant="secondary"
                className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 text-white border-0"
                onClick={nextSlide}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </>
          )}
        </div>

        {/* Dots indicator */}
        {featuredImages.length > 1 && (
          <div className="flex justify-center mt-4 space-x-2">
            {featuredImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-300",
                  index === currentIndex
                    ? "bg-primary w-6"
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                )}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

