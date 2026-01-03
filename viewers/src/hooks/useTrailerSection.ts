import { useState, useCallback, useRef, useEffect } from "react";

export interface MediaItem {
  id: string;
  type: "image" | "video";
  src: string;
  alt?: string;
  thumbnail?: string;
}

/**
 * Custom hook for TrailerSection business logic
 * 
 * BUSINESS LOGIC OVERVIEW:
 * 
 * 1. CAROUSEL NAVIGATION:
 *    - Circular navigation: wraps around from last to first and vice versa
 *    - Next/Previous slide navigation with modulo arithmetic
 *    - Direct navigation via dot indicators
 *    - Stops video playback when navigating between slides
 * 
 * 2. VIDEO PLAYBACK CONTROL:
 *    - Toggle play/pause with custom button overlay
 *    - Auto-plays video when slide changes
 *    - Reloads video source when slide changes for proper initialization
 *    - Handles video errors gracefully
 * 
 * 3. VIDEO EVENT HANDLING:
 *    - Auto-advances to next slide when video ends
 *    - Syncs play/pause state with video element events
 *    - Stops playback on navigation or error
 * 
 * 4. STATE MANAGEMENT:
 *    - Tracks current slide index
 *    - Tracks video playback state
 *    - Resets playback state on slide change
 */
export function useTrailerSection(media: MediaItem[]) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Navigate to next slide (circular)
  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % media.length);
    setIsPlaying(false);
  }, [media.length]);

  // Navigate to previous slide (circular)
  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + media.length) % media.length);
    setIsPlaying(false);
  }, [media.length]);

  // Navigate directly to specific slide
  const goToSlide = useCallback(
    (index: number) => {
      setCurrentIndex(index);
      setIsPlaying(false);
    },
    []
  );

  // Toggle video play/pause
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

  // Handle video ended - auto-advance to next slide
  const handleVideoEnded = useCallback(() => {
    setIsPlaying(false);
    if (media.length > 1) {
      nextSlide();
    }
  }, [nextSlide, media.length]);

  // Handle video play event
  const handleVideoPlayEvent = useCallback(() => {
    setIsPlaying(true);
  }, []);

  // Handle video pause event
  const handleVideoPauseEvent = useCallback(() => {
    setIsPlaying(false);
  }, []);

  // Handle video error
  const handleVideoError = useCallback(() => {
    console.error("Video error");
    setIsPlaying(false);
  }, []);

  // Reload video when slide changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
    }
  }, [currentIndex]);

  const currentMedia = media[currentIndex];
  const hasMultipleMedia = media.length > 1;

  return {
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
  };
}

