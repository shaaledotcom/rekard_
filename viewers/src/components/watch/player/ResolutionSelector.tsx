"use client";

import React, { useState } from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ResolutionSelectorProps {
  currentResolution: string;
  availableResolutions: string[];
  onResolutionChange: (resolution: string) => void;
}

const ResolutionSelector: React.FC<ResolutionSelectorProps> = ({
  currentResolution,
  availableResolutions,
  onResolutionChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!availableResolutions || availableResolutions.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        className="text-white hover:bg-white/20 h-8 px-2 text-xs sm:text-sm"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Settings className="h-4 w-4 mr-1" />
        {currentResolution || "Auto"}
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute bottom-full right-0 mb-2 bg-black/90 rounded-lg p-2 z-40 min-w-[140px]">
            <div className="text-white text-xs font-medium mb-2 px-2">
              Quality
            </div>
            <button
              className={`w-full text-left px-3 py-1.5 text-sm rounded hover:bg-white/20 transition-colors ${
                currentResolution === "auto" || !currentResolution
                  ? "text-primary bg-white/10"
                  : "text-white"
              }`}
              onClick={() => {
                onResolutionChange("auto");
                setIsOpen(false);
              }}
            >
              Auto
            </button>
            {availableResolutions.map((resolution) => (
              <button
                key={resolution}
                className={`w-full text-left px-3 py-1.5 text-sm rounded hover:bg-white/20 transition-colors ${
                  currentResolution === resolution
                    ? "text-primary bg-white/10"
                    : "text-white"
                }`}
                onClick={() => {
                  onResolutionChange(resolution);
                  setIsOpen(false);
                }}
              >
                {resolution}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ResolutionSelector;

