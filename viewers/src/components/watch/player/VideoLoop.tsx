"use client";

import React from "react";
import { Repeat, Repeat1 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VideoLoopProps {
  isLooping: boolean;
  onToggleLoop: () => void;
}

const VideoLoop: React.FC<VideoLoopProps> = ({ isLooping, onToggleLoop }) => {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={`h-8 w-8 sm:h-10 sm:w-10 hover:bg-white/20 ${
        isLooping ? "text-primary" : "text-white"
      }`}
      onClick={onToggleLoop}
      title={isLooping ? "Loop enabled" : "Loop disabled"}
    >
      {isLooping ? (
        <Repeat1 className="h-5 w-5 sm:h-6 sm:w-6" />
      ) : (
        <Repeat className="h-5 w-5 sm:h-6 sm:w-6" />
      )}
    </Button>
  );
};

export default VideoLoop;

