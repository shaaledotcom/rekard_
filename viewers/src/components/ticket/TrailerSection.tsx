"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MediaItem {
  id: string;
  type: "image" | "video";
  src: string;
  alt?: string;
  thumbnail?: string;
}

interface TrailerSectionProps {
  media: MediaItem[];
}

export function TrailerSection({ media }: TrailerSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % media.length);
    setIsPlaying(false);
  }, [media.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + media.length) % media.length);
    setIsPlaying(false);
  }, [media.length]);

  const handleVideoPlay = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().catch((error) => {
          console.error("Error playing video:", error);
        });
        setIsPlaying(true);
      }
    }
  }, [isPlaying]);

  const handleVideoEnded = useCallback(() => {
    setIsPlaying(false);
    nextSlide();
  }, [nextSlide]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
    }
  }, [currentIndex]);

  const currentMedia = media[currentIndex];

  if (!media.length || !currentMedia) {
    return (
      <section className="rounded-lg">
        <div className="w-full h-96 bg-muted rounded-lg flex items-center justify-center">
          <p className="text-muted-foreground">No trailer available</p>
        </div>
      </section>
    );
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
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onError={(e) => {
                  console.error("Video error:", e);
                  setIsPlaying(false);
                }}
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

          {media.length > 1 && (
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

        {media.length > 1 && (
          <div className="flex justify-center mt-4 space-x-2">
            {media.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentIndex(index);
                  setIsPlaying(false);
                }}
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

