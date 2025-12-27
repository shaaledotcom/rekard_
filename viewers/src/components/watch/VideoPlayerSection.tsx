"use client";

import React from "react";
import { VideoPlayer } from "./player";

interface VideoPlayerSectionProps {
  src: string;
  thumbnailSrc?: string;
  onEnded: () => void;
  videoData?: {
    type?: "video" | "audio";
  };
  initialTime?: number;
}

const VideoPlayerSection: React.FC<VideoPlayerSectionProps> = ({
  src,
  thumbnailSrc,
  onEnded,
  videoData = { type: "video" },
  initialTime = 0,
}) => {
  if (!src) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="relative bg-black rounded-lg overflow-hidden w-full">
        <div className="aspect-video w-full">
          <VideoPlayer
            src={src}
            thumbnailSrc={thumbnailSrc}
            onEnded={onEnded}
            videoData={videoData}
            initialTime={initialTime}
          />
        </div>
      </div>
    </div>
  );
};

export default VideoPlayerSection;

