"use client";

import React from "react";
import { Play, Pause } from "lucide-react";

interface PlayPauseAnimationProps {
  isPlaying: boolean;
  show: boolean;
}

const PlayPauseAnimation: React.FC<PlayPauseAnimationProps> = ({
  isPlaying,
  show,
}) => {
  if (!show) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
      <div
        className="bg-black/60 rounded-full p-6 transform scale-100 animate-scale-fade"
        style={{
          animation: "scaleFade 0.5s ease-out forwards",
        }}
      >
        {isPlaying ? (
          <Play className="h-12 w-12 text-white fill-white" />
        ) : (
          <Pause className="h-12 w-12 text-white fill-white" />
        )}
      </div>
      <style jsx>{`
        @keyframes scaleFade {
          0% {
            transform: scale(0.8);
            opacity: 1;
          }
          100% {
            transform: scale(1.2);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default PlayPauseAnimation;

