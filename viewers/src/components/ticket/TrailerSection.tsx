"use client";

import React from "react";
import { ChevronLeft, ChevronRight, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useTrailerSection, MediaItem } from "@/hooks/useTrailerSection";

interface TrailerSectionProps {
  media: MediaItem[];
}

export function TrailerSection({ media }: TrailerSectionProps) {
  const {
    currentIndex,
    currentMedia,
    isPlaying,
    videoRef,
    hasMultipleMedia,
    nextSlide,
    prevSlide,
    goToSlide,
    handleVideoPlay,
    handleVideoEnded,
    handleVideoPlayEvent,
    handleVideoPauseEvent,
    handleVideoError,
  } = useTrailerSection(media);

  if (!media.length || !currentMedia) {
    return null;
  }

  return (
    <section className="rounded-lg">
      <div className="relative w-full">
        <Card className="relative border-0 rounded-lg overflow-hidden w-full p-0 m-0">
          <div className="w-full h-auto relative">
            {currentMedia?.type === "image" ? (
              <img
                src={currentMedia.src}
                alt={currentMedia.alt || "Event media"}
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder-event.jpg";
                }}
              />
            ) : (
              <video
                ref={videoRef}
                src={currentMedia?.src}
                className="w-full h-full object-contain"
                onEnded={handleVideoEnded}
                onPlay={handleVideoPlayEvent}
                onPause={handleVideoPauseEvent}
                onError={handleVideoError}
                preload="metadata"
                controls={false}
                autoPlay={true}
              />
            )}

            {currentMedia?.type === "video" && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-16 w-16 rounded-full bg-black/50 hover:bg-black/70 text-white"
                  onClick={handleVideoPlay}
                >
                  {isPlaying ? (
                    <Pause className="h-8 w-8" />
                  ) : (
                    <Play className="h-8 w-8 ml-1" />
                  )}
                </Button>
              </div>
            )}
          </div>

          {hasMultipleMedia && (
            <>
              <Button
                size="icon"
                variant="secondary"
                className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 text-white"
                onClick={prevSlide}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>

              <Button
                size="icon"
                variant="secondary"
                className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 text-white"
                onClick={nextSlide}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </>
          )}
        </Card>

        {hasMultipleMedia && (
          <div className="flex justify-center mt-4 space-x-2">
            {media.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={cn(
                  "w-2 h-2 rounded-full transition-colors",
                  index === currentIndex
                    ? "bg-primary"
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

