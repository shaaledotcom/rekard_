"use client";

import React from "react";
import { Maximize, Minimize } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FullscreenButtonProps {
  isFullscreen: boolean;
  onFullscreenToggle: () => void;
}

const FullscreenButton: React.FC<FullscreenButtonProps> = ({
  isFullscreen,
  onFullscreenToggle,
}) => {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="text-white hover:bg-white/20 h-8 w-8 sm:h-10 sm:w-10"
      onClick={onFullscreenToggle}
    >
      {isFullscreen ? (
        <Minimize className="h-5 w-5 sm:h-6 sm:w-6" />
      ) : (
        <Maximize className="h-5 w-5 sm:h-6 sm:w-6" />
      )}
    </Button>
  );
};

export default FullscreenButton;

