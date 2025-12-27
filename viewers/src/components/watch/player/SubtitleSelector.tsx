"use client";

import React, { useState } from "react";
import { Captions, CaptionsOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SubtitleSelectorProps {
  currentSubtitle: string;
  availableSubtitles: string[];
  onSubtitleChange: (subtitle: string) => void;
}

const SubtitleSelector: React.FC<SubtitleSelectorProps> = ({
  currentSubtitle,
  availableSubtitles,
  onSubtitleChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!availableSubtitles || availableSubtitles.length === 0) {
    return null;
  }

  const isSubtitlesOff = currentSubtitle === "off" || !currentSubtitle;

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="text-white hover:bg-white/20 h-8 w-8 sm:h-10 sm:w-10"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isSubtitlesOff ? (
          <CaptionsOff className="h-5 w-5 sm:h-6 sm:w-6" />
        ) : (
          <Captions className="h-5 w-5 sm:h-6 sm:w-6" />
        )}
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute bottom-full right-0 mb-2 bg-black/90 rounded-lg p-2 z-40 min-w-[140px]">
            <div className="text-white text-xs font-medium mb-2 px-2">
              Subtitles
            </div>
            <button
              className={`w-full text-left px-3 py-1.5 text-sm rounded hover:bg-white/20 transition-colors ${
                isSubtitlesOff ? "text-primary bg-white/10" : "text-white"
              }`}
              onClick={() => {
                onSubtitleChange("off");
                setIsOpen(false);
              }}
            >
              Off
            </button>
            {availableSubtitles.map((subtitle) => (
              <button
                key={subtitle}
                className={`w-full text-left px-3 py-1.5 text-sm rounded hover:bg-white/20 transition-colors ${
                  currentSubtitle === subtitle
                    ? "text-primary bg-white/10"
                    : "text-white"
                }`}
                onClick={() => {
                  onSubtitleChange(subtitle);
                  setIsOpen(false);
                }}
              >
                {subtitle}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default SubtitleSelector;

