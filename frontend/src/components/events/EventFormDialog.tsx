"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import type { CreateEventRequest } from "@/store/api";
import { formatDateTimeLocal } from "./utils";
import { Film, Radio, Loader2 } from "lucide-react";

interface EventFormDialogProps {
  isOpen: boolean;
  isEditMode: boolean;
  formData: CreateEventRequest;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: () => void;
  onFormChange: (data: CreateEventRequest) => void;
}

export function EventFormDialog({
  isOpen,
  isEditMode,
  formData,
  isSubmitting,
  onClose,
  onSubmit,
  onFormChange,
}: EventFormDialogProps) {
  const isVOD = formData.is_vod;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent onClose={onClose} className="bg-[#12121a] border-white/10 max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header with color stripe */}
        <div className="relative h-16 -mx-0 -mt-0 rounded-t-2xl flex items-center justify-center"
          style={{
            background: isVOD
              ? "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)"
              : "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)"
          }}
        >
          <div className="flex items-center gap-3">
            {isVOD ? (
              <Film className="w-6 h-6 text-white" />
            ) : (
              <Radio className="w-6 h-6 text-white" />
            )}
            <span className="text-white font-medium">
              {isVOD ? "Video on Demand" : "Live Event"}
            </span>
          </div>
        </div>

        <DialogHeader className="pt-2">
          <DialogTitle className="text-2xl text-white">
            {isEditMode ? "Edit Event" : "Create New Event"}
          </DialogTitle>
          <DialogDescription className="text-white/50">
            {isEditMode
              ? "Update your event details below"
              : "Fill in the details to create your amazing event"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 px-6 pb-2">
          {/* Event Type Toggle */}
          <div className="space-y-2">
            <Label className="text-white/70 text-sm font-medium">Event Type</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onFormChange({ ...formData, is_vod: false })}
                className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                  !isVOD
                    ? "bg-blue-500/20 border-blue-500 text-white"
                    : "bg-white/5 border-white/10 text-white/60 hover:border-white/20"
                }`}
              >
                <Radio className="w-5 h-5" />
                <div className="text-left">
                  <p className="font-medium text-sm">Live Event</p>
                  <p className="text-xs opacity-60">Scheduled broadcast</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => onFormChange({ ...formData, is_vod: true })}
                className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                  isVOD
                    ? "bg-purple-500/20 border-purple-500 text-white"
                    : "bg-white/5 border-white/10 text-white/60 hover:border-white/20"
                }`}
              >
                <Film className="w-5 h-5" />
                <div className="text-left">
                  <p className="font-medium text-sm">Video on Demand</p>
                  <p className="text-xs opacity-60">Watch anytime</p>
                </div>
              </button>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label className="text-white/70 text-sm font-medium">Event Title *</Label>
            <Input
              value={formData.title}
              onChange={(e) => onFormChange({ ...formData, title: e.target.value })}
              placeholder="Give your event a catchy name..."
              className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl focus:border-yellow-500/50"
            />
          </div>

          {/* Description with Rich Text Editor */}
          <div className="space-y-2">
            <Label className="text-white/70 text-sm font-medium">Description</Label>
            <RichTextEditor
              value={formData.description || ""}
              onChange={(value) => onFormChange({ ...formData, description: value })}
              placeholder="Tell your audience what makes this event special..."
            />
          </div>

          {/* Live Event Fields - Only shown when NOT VOD */}
          {!isVOD && (
            <>
              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white/70 text-sm font-medium">Start Date & Time *</Label>
                  <Input
                    type="datetime-local"
                    value={formatDateTimeLocal(formData.start_datetime)}
                    onChange={(e) =>
                      onFormChange({
                        ...formData,
                        start_datetime: new Date(e.target.value).toISOString(),
                      })
                    }
                    className="h-12 bg-white/5 border-white/10 text-white rounded-xl focus:border-blue-500/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/70 text-sm font-medium">End Date & Time *</Label>
                  <Input
                    type="datetime-local"
                    value={formatDateTimeLocal(formData.end_datetime)}
                    onChange={(e) =>
                      onFormChange({
                        ...formData,
                        end_datetime: new Date(e.target.value).toISOString(),
                      })
                    }
                    className="h-12 bg-white/5 border-white/10 text-white rounded-xl focus:border-blue-500/50"
                  />
                </div>
              </div>

              {/* Convert to VOD after event */}
              <label className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:border-purple-500/30 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.convert_to_vod_after_event}
                  onChange={(e) =>
                    onFormChange({ ...formData, convert_to_vod_after_event: e.target.checked })
                  }
                  className="w-5 h-5 rounded border-white/20 bg-white/5 text-purple-500 focus:ring-purple-500/50"
                />
                <div>
                  <p className="text-white font-medium text-sm">Convert to VOD after event</p>
                  <p className="text-white/40 text-xs">Make recording available for replay</p>
                </div>
              </label>
            </>
          )}

          {/* VOD Specific Fields - Only shown when IS VOD */}
          {isVOD && (
            <div className="space-y-4 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <h4 className="text-sm font-semibold text-purple-300 flex items-center gap-2">
                <Film className="w-4 h-4" />
                VOD Options
              </h4>

              {/* Watch Up To */}
              <div className="space-y-2">
                <Label className="text-white/70 text-sm font-medium">Watch Up To</Label>
                <Input
                  value={formData.watch_upto || ""}
                  onChange={(e) => onFormChange({ ...formData, watch_upto: e.target.value })}
                  placeholder="e.g., 48 hours, 7 days after purchase"
                  className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl focus:border-purple-500/50"
                />
                <p className="text-xs text-white/40">
                  How long viewers can access the content after purchase
                </p>
              </div>

              {/* Archive After */}
              <div className="space-y-2">
                <Label className="text-white/70 text-sm font-medium">Archive After</Label>
                <Input
                  type="datetime-local"
                  value={formData.archive_after ? formatDateTimeLocal(formData.archive_after) : ""}
                  onChange={(e) =>
                    onFormChange({
                      ...formData,
                      archive_after: e.target.value ? new Date(e.target.value).toISOString() : "",
                    })
                  }
                  className="h-12 bg-white/5 border-white/10 text-white rounded-xl focus:border-purple-500/50"
                />
                <p className="text-xs text-white/40">
                  Date when this content will be archived and no longer available
                </p>
              </div>
            </div>
          )}

        </div>

        <DialogFooter className="rounded-b-2xl">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-white/70 hover:text-white hover:bg-white/5"
          >
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            disabled={!formData.title || isSubmitting}
            className={`font-semibold px-6 disabled:opacity-50 shadow-lg ${
              isVOD
                ? "bg-purple-500 hover:bg-purple-600 shadow-purple-500/30"
                : "bg-blue-500 hover:bg-blue-600 shadow-blue-500/30"
            } text-white`}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </span>
            ) : isEditMode ? (
              "Save Changes"
            ) : (
              "Create Event"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
