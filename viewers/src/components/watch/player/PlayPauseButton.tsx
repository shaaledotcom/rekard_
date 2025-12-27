"use client";

import React from "react";
import { Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PlayPauseButtonProps {
  isPlaying: boolean;
  onPlayPause: () => void;
}

const PlayPauseButton: React.FC<PlayPauseButtonProps> = ({
  isPlaying,
  onPlayPause,
}) => {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="text-white hover:bg-white/20 h-8 w-8 sm:h-10 sm:w-10"
      onClick={onPlayPause}
    >
      {isPlaying ? (
        <Pause className="h-5 w-5 sm:h-6 sm:w-6" />
      ) : (
        <Play className="h-5 w-5 sm:h-6 sm:w-6" />
      )}
    </Button>
  );
};

export default PlayPauseButton;

