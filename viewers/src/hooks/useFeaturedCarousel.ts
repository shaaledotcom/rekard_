import { useState, useCallback, useEffect } from "react";
import { useTenant } from "@/hooks/useTenant";

/**
 * Custom hook for FeaturedCarousel business logic
 * 
 * BUSINESS LOGIC OVERVIEW:
 * 
 * 1. CAROUSEL NAVIGATION:
 *    - Circular navigation: wraps around from last to first and vice versa
 *    - Next/Previous slide navigation with modulo arithmetic
 *    - Direct navigation via dot indicators
 *    - Auto-advance every 5 seconds (disabled for single image)
 * 
 * 2. IMAGE INTERACTION:
 *    - Clickable images open links in new tab when link is provided
 *    - Security: Uses noopener and noreferrer for external links
 *    - Visual feedback: Hover opacity change for clickable images
 * 
 * 3. STATE MANAGEMENT:
 *    - Tracks current slide index
 *    - Resets to first slide when featured images change
 *    - Auto-advance interval cleanup on unmount or image count change
 * 
 * 4. VISIBILITY LOGIC:
 *    - Hides carousel when no featured images are configured
 *    - Shows navigation controls only when multiple images exist
 *    - Displays loading skeleton while tenant config loads
 */
export function useFeaturedCarousel() {
  const { config, isLoading } = useTenant();
  const [currentIndex, setCurrentIndex] = useState(0);

  const featuredImages = config?.featured_images || [];
  const hasFeaturedImages = featuredImages.length > 0;

  // Reset to first slide when images change
  useEffect(() => {
    setCurrentIndex(0);
  }, [featuredImages.length]);

  // Navigate to next slide (circular)
  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % featuredImages.length);
  }, [featuredImages.length]);

  // Navigate to previous slide (circular)
  const prevSlide = useCallback(() => {
    setCurrentIndex(
      (prev) => (prev - 1 + featuredImages.length) % featuredImages.length
    );
  }, [featuredImages.length]);

  // Navigate directly to specific slide
  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  // Auto-advance slides every 5 seconds (only for multiple images)
  useEffect(() => {
    if (featuredImages.length <= 1) return;
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [nextSlide, featuredImages.length]);

  // Handle image click - open link in new tab if available
  const handleImageClick = useCallback(
    (image: { url: string; link?: string }) => {
      if (image.link) {
        window.open(image.link, "_blank", "noopener,noreferrer");
      }
    },
    []
  );

  const currentImage = featuredImages[currentIndex];
  const hasLink = currentImage?.link;

  return {
    featuredImages,
    hasFeaturedImages,
    currentIndex,
    currentImage,
    hasLink,
    isLoading,
    nextSlide,
    prevSlide,
    goToSlide,
    handleImageClick,
  };
}

