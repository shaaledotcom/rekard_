"use client";

import React, { useRef, useState, useCallback } from "react";

interface ProgressBarProps {
  currentTime: number;
  duration: number;
  bufferedTime: number;
  onSeek: (time: number) => void;
  showThumbnail?: boolean;
  videoRef?: React.RefObject<HTMLVideoElement>;
}

const formatTime = (time: number): string => {
  if (isNaN(time) || !isFinite(time)) return "0:00";
  const hours = Math.floor(time / 3600);
  const minutes = Math.floor((time % 3600) / 60);
  const seconds = Math.floor(time % 60);
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

const ProgressBar: React.FC<ProgressBarProps> = ({
  currentTime,
  duration,
  bufferedTime,
  onSeek,
  showThumbnail = true,
  videoRef,
}) => {
  const progressBarRef = useRef<HTMLDivElement>(null);
  const thumbnailCanvasRef = useRef<HTMLCanvasElement>(null);
  const [hoverTime, setHoverTime] = useState(0);
  const [hoverPosition, setHoverPosition] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = duration > 0 ? (bufferedTime / duration) * 100 : 0;

  const updateThumbnail = useCallback(
    (time: number) => {
      const canvas = thumbnailCanvasRef.current;
      const video = videoRef?.current;
      if (!canvas || !video || !showThumbnail) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Clone video temporarily to seek
      const tempTime = video.currentTime;
      // We can't actually seek to get thumbnail without affecting playback
      // This is a simplified version - full implementation would use MediaSource API
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    },
    [videoRef, showThumbnail]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!progressBarRef.current || !duration) return;
      const rect = progressBarRef.current.getBoundingClientRect();
      const position = (e.clientX - rect.left) / rect.width;
      const clampedPosition = Math.max(0, Math.min(1, position));
      const time = clampedPosition * duration;

      setHoverPosition(clampedPosition * 100);
      setHoverTime(time);
      setIsHovering(true);

      if (isDragging) {
        onSeek(time);
      }

      if (showThumbnail) {
        updateThumbnail(time);
      }
    },
    [duration, onSeek, isDragging, showThumbnail, updateThumbnail]
  );

  const handleMouseLeave = useCallback(() => {
    if (!isDragging) {
      setIsHovering(false);
    }
  }, [isDragging]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!progressBarRef.current || !duration) return;
      const rect = progressBarRef.current.getBoundingClientRect();
      const position = (e.clientX - rect.left) / rect.width;
      const clampedPosition = Math.max(0, Math.min(1, position));
      const time = clampedPosition * duration;
      onSeek(time);
    },
    [duration, onSeek]
  );

  const handleMouseDown = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  React.useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseUp = () => setIsDragging(false);
      window.addEventListener("mouseup", handleGlobalMouseUp);
      return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
    }
  }, [isDragging]);

  return (
    <div
      ref={progressBarRef}
      className="w-full mb-3 cursor-pointer group relative"
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      {/* Hover Time Indicator */}
      {isHovering && (
        <div
          className="absolute -top-8 transform -translate-x-1/2 bg-black/90 text-white text-xs px-2 py-1 rounded pointer-events-none z-30"
          style={{ left: `${hoverPosition}%` }}
        >
          {formatTime(hoverTime)}
        </div>
      )}

      {/* Thumbnail Preview */}
      {showThumbnail && isHovering && (
        <div
          className="absolute -top-28 transform -translate-x-1/2 pointer-events-none z-30"
          style={{ left: `${hoverPosition}%` }}
        >
          <canvas
            ref={thumbnailCanvasRef}
            width={160}
            height={90}
            className="rounded border border-white/20 bg-black"
          />
        </div>
      )}

      {/* Progress Bar Track */}
      <div className="h-1 bg-gray-600/60 relative rounded-full overflow-hidden group-hover:h-2 transition-all duration-150">
        {/* Buffered */}
        <div
          className="h-full bg-gray-400/50 absolute top-0 left-0 rounded-full"
          style={{ width: `${bufferedPercent}%` }}
        />

        {/* Hover Preview */}
        {isHovering && (
          <div
            className="h-full bg-white/30 absolute top-0 left-0 rounded-full"
            style={{ width: `${hoverPosition}%` }}
          />
        )}

        {/* Progress */}
        <div
          className="h-full bg-primary absolute top-0 left-0 rounded-full z-10"
          style={{ width: `${progressPercent}%` }}
        />

        {/* Scrubber Handle */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-lg"
          style={{ left: `calc(${progressPercent}% - 6px)` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;

