"use client";

import { Label } from "@/components/ui/label";
import { MessageCircle, Info } from "lucide-react";
import type { PlatformFormData } from "./types";

interface WatchPageSectionProps {
  formData: PlatformFormData;
  onChange: (data: Partial<PlatformFormData>) => void;
  isReadOnly?: boolean;
}

export function WatchPageSection({
  formData,
  onChange,
  isReadOnly = false,
}: WatchPageSectionProps) {
  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold text-foreground">Watch Page Settings</h3>
        <p className="text-sm text-muted-foreground">
          Configure the viewing experience for your platform
        </p>
      </div>

      {/* Live Chat Toggle */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-muted-foreground" />
          <Label className="text-foreground/70 text-sm font-medium">
            Live Chat & Comments
          </Label>
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl bg-secondary border border-border">
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Enable Live Chat</p>
            <p className="text-xs text-muted-foreground">
              Allow viewers to interact with live chat and comments during events
            </p>
          </div>
          <button
            type="button"
            onClick={() => !isReadOnly && onChange({ enable_live_chat: !formData.enable_live_chat })}
            disabled={isReadOnly}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ${
              formData.enable_live_chat ? "bg-primary" : "bg-muted"
            } ${isReadOnly ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform duration-200 ${
                formData.enable_live_chat ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        {/* Info Box */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-secondary/50 border border-border">
          <Info className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div className="space-y-2">
            <p className="text-sm text-foreground">What does live chat enable?</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Real-time chat messages during live events</li>
              <li>• Comment sections on video on demand (VOD) content</li>
              <li>• Interactive viewer engagement features</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

