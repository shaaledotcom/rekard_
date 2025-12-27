"use client";

import React, { useState } from "react";
import { Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PlaybackRateSelectorProps {
  currentRate: number;
  onRateChange: (rate: string) => void;
}

const PLAYBACK_RATES = [
  { value: "0.5", label: "0.5x" },
  { value: "0.75", label: "0.75x" },
  { value: "1", label: "Normal" },
  { value: "1.25", label: "1.25x" },
  { value: "1.5", label: "1.5x" },
  { value: "1.75", label: "1.75x" },
  { value: "2", label: "2x" },
];

const PlaybackRateSelector: React.FC<PlaybackRateSelectorProps> = ({
  currentRate,
  onRateChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        className="text-white hover:bg-white/20 h-8 px-2 text-xs sm:text-sm"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Gauge className="h-4 w-4 mr-1" />
        {currentRate}x
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute bottom-full left-0 mb-2 bg-black/90 rounded-lg p-2 z-40 min-w-[120px]">
            <div className="text-white text-xs font-medium mb-2 px-2">
              Playback Speed
            </div>
            {PLAYBACK_RATES.map((rate) => (
              <button
                key={rate.value}
                className={`w-full text-left px-3 py-1.5 text-sm rounded hover:bg-white/20 transition-colors ${
                  currentRate === parseFloat(rate.value)
                    ? "text-primary bg-white/10"
                    : "text-white"
                }`}
                onClick={() => {
                  onRateChange(rate.value);
                  setIsOpen(false);
                }}
              >
                {rate.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default PlaybackRateSelector;

