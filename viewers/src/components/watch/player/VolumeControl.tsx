"use client";

import React from "react";
import { Volume2, VolumeX, Volume1 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface VolumeControlProps {
  isMuted: boolean;
  volume: number;
  onMuteUnmute: () => void;
  onVolumeChange: (volume: number) => void;
}

const VolumeControl: React.FC<VolumeControlProps> = ({
  isMuted,
  volume,
  onMuteUnmute,
  onVolumeChange,
}) => {
  const getVolumeIcon = () => {
    if (isMuted || volume === 0) {
      return <VolumeX className="h-5 w-5 sm:h-6 sm:w-6" />;
    }
    if (volume < 0.5) {
      return <Volume1 className="h-5 w-5 sm:h-6 sm:w-6" />;
    }
    return <Volume2 className="h-5 w-5 sm:h-6 sm:w-6" />;
  };

  return (
    <div className="flex items-center gap-1 group">
      <Button
        variant="ghost"
        size="icon"
        className="text-white hover:bg-white/20 h-8 w-8 sm:h-10 sm:w-10"
        onClick={onMuteUnmute}
      >
        {getVolumeIcon()}
      </Button>
      <div className="hidden sm:flex w-0 overflow-hidden group-hover:w-20 transition-all duration-300">
        <Slider
          value={[isMuted ? 0 : volume]}
          max={1}
          step={0.05}
          onValueChange={(value) => onVolumeChange(value[0])}
          className="cursor-pointer"
        />
      </div>
    </div>
  );
};

export default VolumeControl;

