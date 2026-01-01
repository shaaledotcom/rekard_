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
import { localToUTC } from "@/lib/datetime";
import { Textarea } from "@/components/ui/textarea";
import { Film, Radio, Loader2, Eye, EyeOff, AlertCircle, CheckCircle2, Upload, X, Video, FileImage } from "lucide-react";
import { useState, useRef, useCallback } from "react";

interface EventFormDialogProps {
  isOpen: boolean;
  isEditMode: boolean;
  formData: CreateEventRequest;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: () => void;
  onFormChange: (data: CreateEventRequest) => void;
  videoFile?: File | null;
  onVideoFileChange?: (file: File | null) => void;
  thumbnailFile?: File | null;
  onThumbnailFileChange?: (file: File | null) => void;
}

const MAX_VIDEO_SIZE = 5 * 1024 * 1024 * 1024; // 5GB
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/ogg", "video/quicktime"];
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export function EventFormDialog({
  isOpen,
  isEditMode,
  formData,
  isSubmitting,
  onClose,
  onSubmit,
  onFormChange,
  videoFile,
  onVideoFileChange,
  thumbnailFile,
  onThumbnailFileChange,
}: EventFormDialogProps) {
  const isVOD = formData.is_vod;
  const [showEmbedPreview, setShowEmbedPreview] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [thumbnailDragOver, setThumbnailDragOver] = useState(false);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  // Check if embed code looks valid (contains iframe or common embed patterns)
  const embedCode = formData.embed || "";
  const isValidEmbed = embedCode.trim().length > 0 && (
    embedCode.includes("<iframe") ||
    embedCode.includes("<embed") ||
    embedCode.includes("<video") ||
    embedCode.includes("<object")
  );

  const validateVideoFile = (file: File): string | null => {
    if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
      return `File type ${file.type} is not supported. Please use MP4, WebM, OGG, or QuickTime formats.`;
    }
    if (file.size > MAX_VIDEO_SIZE) {
      const sizeInGB = MAX_VIDEO_SIZE / (1024 * 1024 * 1024);
      return `File size must be less than ${sizeInGB}GB`;
    }
    return null;
  };

  const handleVideoFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const error = validateVideoFile(file);
    if (error) {
      alert(error);
      return;
    }

    onVideoFileChange?.(file);
    // Clear embed when video file is selected
    onFormChange({ ...formData, embed: undefined });
  }, [formData, onFormChange, onVideoFileChange]);

  const handleVideoDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const file = e.dataTransfer.files[0];
    if (!file) return;

    const error = validateVideoFile(file);
    if (error) {
      alert(error);
      return;
    }

    onVideoFileChange?.(file);
    // Clear embed when video file is selected
    onFormChange({ ...formData, embed: undefined });
  }, [formData, onFormChange, onVideoFileChange]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const removeVideoFile = useCallback(() => {
    onVideoFileChange?.(null);
    if (videoInputRef.current) {
      videoInputRef.current.value = "";
    }
  }, [onVideoFileChange]);

  const validateImageFile = (file: File): string | null => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return `File type ${file.type} is not supported. Please use JPEG, PNG, or WebP formats.`;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      return `File size must be less than ${Math.round(MAX_IMAGE_SIZE / 1024 / 1024)}MB`;
    }
    return null;
  };

  const handleThumbnailFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const error = validateImageFile(file);
    if (error) {
      alert(error);
      return;
    }

    onThumbnailFileChange?.(file);
    // Clear existing URL when new file is selected
    onFormChange({ ...formData, thumbnail_image_portrait: undefined });
  }, [formData, onFormChange, onThumbnailFileChange]);

  const handleThumbnailDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setThumbnailDragOver(false);

    const file = e.dataTransfer.files[0];
    if (!file) return;

    const error = validateImageFile(file);
    if (error) {
      alert(error);
      return;
    }

    onThumbnailFileChange?.(file);
    onFormChange({ ...formData, thumbnail_image_portrait: undefined });
  }, [formData, onFormChange, onThumbnailFileChange]);

  const handleThumbnailDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setThumbnailDragOver(true);
  }, []);

  const handleThumbnailDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setThumbnailDragOver(false);
  }, []);

  const removeThumbnailFile = useCallback(() => {
    onThumbnailFileChange?.(null);
    onFormChange({ ...formData, thumbnail_image_portrait: undefined });
    if (thumbnailInputRef.current) {
      thumbnailInputRef.current.value = "";
    }
  }, [formData, onFormChange, onThumbnailFileChange]);

  const getVideoPreview = () => {
    if (videoFile) {
      return URL.createObjectURL(videoFile);
    }
    if (formData.embed && formData.embed.startsWith("http")) {
      return formData.embed;
    }
    return null;
  };

  const getThumbnailPreview = () => {
    if (thumbnailFile) {
      return URL.createObjectURL(thumbnailFile);
    }
    if (formData.thumbnail_image_portrait) {
      return formData.thumbnail_image_portrait;
    }
    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent onClose={onClose} className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative h-16 -mx-0 -mt-0 rounded-t-2xl flex items-center justify-center bg-secondary">
          <div className="flex items-center gap-3">
            {isVOD ? (
              <Film className="w-6 h-6 text-foreground" />
            ) : (
              <Radio className="w-6 h-6 text-foreground" />
            )}
            <span className="text-foreground font-medium">
              {isVOD ? "Video on Demand" : "Live Event"}
            </span>
          </div>
        </div>

        <DialogHeader className="pt-2">
          <DialogTitle className="text-2xl text-foreground">
            {isEditMode ? "Edit Event" : "Create New Event"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {isEditMode
              ? "Update your event details below"
              : "Fill in the details to create your amazing event"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 px-6 pb-2">
          {/* Event Type Toggle */}
          <div className="space-y-2">
            <Label className="text-foreground/70 text-sm font-medium">Event Type</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  onFormChange({ ...formData, is_vod: false });
                  // Clear video file when switching to Live event
                  if (videoFile) {
                    onVideoFileChange?.(null);
                  }
                }}
                className={`flex items-center gap-3 p-4 rounded-xl border ${
                  !isVOD
                    ? "bg-foreground/10 border-foreground text-foreground"
                    : "bg-secondary border-border text-muted-foreground hover:border-foreground/30"
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
                className={`flex items-center gap-3 p-4 rounded-xl border ${
                  isVOD
                    ? "bg-foreground/10 border-foreground text-foreground"
                    : "bg-secondary border-border text-muted-foreground hover:border-foreground/30"
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
            <Label className="text-foreground/70 text-sm font-medium">Event Title *</Label>
            <Input
              value={formData.title}
              onChange={(e) => onFormChange({ ...formData, title: e.target.value })}
              placeholder="Give your event a catchy name..."
              className="h-12 bg-secondary border-border text-foreground placeholder:text-muted-foreground rounded-xl focus:border-foreground/50"
            />
          </div>

          {/* Description with Rich Text Editor */}
          <div className="space-y-2">
            <Label className="text-foreground/70 text-sm font-medium">Description</Label>
            <RichTextEditor
              value={formData.description || ""}
              onChange={(value) => onFormChange({ ...formData, description: value })}
              placeholder="Tell your audience what makes this event special..."
            />
          </div>

          {/* Thumbnail Image Upload */}
          <div className="space-y-3">
            <Label className="text-foreground/70 text-sm font-medium flex items-center gap-2">
              <FileImage className="w-4 h-4" />
              Thumbnail Image
            </Label>
            
            {getThumbnailPreview() ? (
              <div className="space-y-3 p-4 rounded-xl bg-secondary border border-border">
                <div className="relative">
                  <img
                    className="w-32 h-48 object-cover rounded-lg mx-auto"
                    src={getThumbnailPreview() || undefined}
                    alt="Thumbnail preview"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8"
                    onClick={removeThumbnailFile}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                {thumbnailFile && (
                  <div className="text-xs text-muted-foreground text-center">
                    <p>{thumbnailFile.name}</p>
                    <p>Size: {(thumbnailFile.size / 1024 / 1024).toFixed(2)}MB</p>
                  </div>
                )}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => thumbnailInputRef.current?.click()}
                  className="w-full bg-background border-border text-foreground hover:bg-muted"
                >
                  {thumbnailFile ? "Replace Thumbnail" : "Change Thumbnail"}
                </Button>
              </div>
            ) : (
              <div
                className={`relative border-2 border-dashed rounded-xl p-6 text-center ${
                  thumbnailDragOver
                    ? "border-foreground bg-secondary"
                    : "border-border hover:border-foreground/50 bg-secondary"
                }`}
                onDragOver={handleThumbnailDragOver}
                onDragLeave={handleThumbnailDragLeave}
                onDrop={handleThumbnailDrop}
              >
                <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-medium text-foreground/70 mb-1">
                  {thumbnailDragOver ? "Drop image here" : "Drag & drop or click to upload"}
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  Upload thumbnail image (JPEG, PNG, WebP up to 10MB)
                  <br />
                  <span className="text-muted-foreground/70">Portrait orientation (9:16) recommended</span>
                </p>
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => thumbnailInputRef.current?.click()}
                  className="w-full bg-background border-border text-foreground hover:bg-muted"
                >
                  Choose Thumbnail Image
                </Button>

                <input
                  ref={thumbnailInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailFileChange}
                  className="hidden"
                />
              </div>
            )}
          </div>

          {/* Video Upload (VOD) or Embed Code (Live) */}
          {isVOD ? (
            <div className="space-y-3">
              <Label className="text-foreground/70 text-sm font-medium flex items-center gap-2">
                <Video className="w-4 h-4" />
                Video File
              </Label>
              
              {videoFile || (formData.embed && formData.embed.startsWith("http")) ? (
                <div className="space-y-3 p-4 rounded-xl bg-secondary border border-border">
                  <div className="relative">
                    <video
                      className="w-full h-48 object-cover rounded-lg"
                      controls
                      src={getVideoPreview() || undefined}
                    />
                    {videoFile && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8"
                        onClick={removeVideoFile}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  {videoFile && (
                    <div className="text-xs text-muted-foreground">
                      <p>{videoFile.name}</p>
                      <p>Size: {(videoFile.size / 1024 / 1024).toFixed(2)}MB</p>
                    </div>
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => videoInputRef.current?.click()}
                    className="w-full bg-background border-border text-foreground hover:bg-muted"
                  >
                    {videoFile ? "Replace Video" : "Change Video"}
                  </Button>
                </div>
              ) : (
                <div
                  className={`relative border-2 border-dashed rounded-xl p-6 text-center ${
                    dragOver
                      ? "border-foreground bg-secondary"
                      : "border-border hover:border-foreground/50 bg-secondary"
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleVideoDrop}
                >
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm font-medium text-foreground/70 mb-1">
                    {dragOver ? "Drop video file here" : "Drag & drop or click to upload"}
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Upload your video file (MP4, WebM, OGG, QuickTime up to 5GB)
                  </p>
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => videoInputRef.current?.click()}
                    className="w-full bg-background border-border text-foreground hover:bg-muted"
                  >
                    Choose Video File
                  </Button>

                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleVideoFileChange}
                    className="hidden"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-foreground/70 text-sm font-medium">Embed Code</Label>
                {embedCode.trim() && (
                  <div className="flex items-center gap-2">
                    {isValidEmbed ? (
                      <span className="flex items-center gap-1 text-xs text-green-500">
                        <CheckCircle2 className="w-3 h-3" />
                        Valid embed detected
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-yellow-500">
                        <AlertCircle className="w-3 h-3" />
                        Check embed format
                      </span>
                    )}
                  </div>
                )}
              </div>
              <Textarea
                value={formData.embed || ""}
                onChange={(e) => onFormChange({ ...formData, embed: e.target.value })}
                placeholder="Paste your embed code or iframe here...&#10;Example: <iframe src='https://player.example.com/...' width='100%' height='400'></iframe>"
                className="min-h-[100px] bg-secondary border-border text-foreground placeholder:text-muted-foreground rounded-xl focus:border-foreground/50 font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Add an embed code for your streaming player (e.g., YouTube, Vimeo, custom player)
              </p>

              {/* Embed Preview Toggle */}
              {embedCode.trim() && (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setShowEmbedPreview(!showEmbedPreview)}
                    className="flex items-center gap-2 text-sm text-foreground/70 hover:text-foreground transition-colors"
                  >
                    {showEmbedPreview ? (
                      <>
                        <EyeOff className="w-4 h-4" />
                        Hide Preview
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4" />
                        Show Preview
                      </>
                    )}
                  </button>

                  {/* Embed Preview */}
                  {showEmbedPreview && (
                    <div className="rounded-xl border border-border overflow-hidden bg-black/50">
                      <div className="px-3 py-2 bg-secondary/50 border-b border-border flex items-center gap-2">
                        <Eye className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground font-medium">Embed Preview</span>
                      </div>
                      <div 
                        className="p-4 min-h-[200px] flex items-center justify-center [&>iframe]:max-w-full [&>iframe]:rounded-lg [&>video]:max-w-full [&>video]:rounded-lg"
                        dangerouslySetInnerHTML={{ __html: embedCode }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Live Event Fields - Only shown when NOT VOD */}
          {!isVOD && (
            <>
              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-foreground/70 text-sm font-medium">Start Date & Time *</Label>
                  <Input
                    type="datetime-local"
                    value={formatDateTimeLocal(formData.start_datetime)}
                    onChange={(e) =>
                      onFormChange({
                        ...formData,
                        start_datetime: localToUTC(e.target.value),
                      })
                    }
                    className="h-12 bg-secondary border-border text-foreground rounded-xl focus:border-foreground/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground/70 text-sm font-medium">End Date & Time *</Label>
                  <Input
                    type="datetime-local"
                    value={formatDateTimeLocal(formData.end_datetime)}
                    onChange={(e) =>
                      onFormChange({
                        ...formData,
                        end_datetime: localToUTC(e.target.value),
                      })
                    }
                    className="h-12 bg-secondary border-border text-foreground rounded-xl focus:border-foreground/50"
                  />
                </div>
              </div>

              {/* Convert to VOD after event */}
              <label className="flex items-center gap-3 p-4 rounded-xl bg-secondary border border-border cursor-pointer hover:border-foreground/30">
                <input
                  type="checkbox"
                  checked={formData.convert_to_vod_after_event}
                  onChange={(e) =>
                    onFormChange({ ...formData, convert_to_vod_after_event: e.target.checked })
                  }
                  className="w-5 h-5 rounded border-border bg-background text-foreground focus:ring-foreground/50"
                />
                <div>
                  <p className="text-foreground font-medium text-sm">Convert to VOD after event</p>
                  <p className="text-muted-foreground text-xs">Make recording available for replay</p>
                </div>
              </label>
            </>
          )}

          {/* VOD Specific Fields - Only shown when IS VOD */}
          {isVOD && (
            <div className="space-y-4 p-4 rounded-xl bg-secondary border border-border">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Film className="w-4 h-4" />
                VOD Options
              </h4>

              {/* Watch Up To */}
              <div className="space-y-2">
                <Label className="text-foreground/70 text-sm font-medium">Watch Up To</Label>
                <Input
                  value={formData.watch_upto || ""}
                  onChange={(e) => onFormChange({ ...formData, watch_upto: e.target.value })}
                  placeholder="e.g., 48 hours, 7 days after purchase"
                  className="h-12 bg-background border-border text-foreground placeholder:text-muted-foreground rounded-xl focus:border-foreground/50"
                />
                <p className="text-xs text-muted-foreground">
                  How long viewers can access the content after purchase
                </p>
              </div>

              {/* Archive After */}
              <div className="space-y-2">
                <Label className="text-foreground/70 text-sm font-medium">Archive After</Label>
                <Input
                  type="datetime-local"
                  value={formData.archive_after ? formatDateTimeLocal(formData.archive_after) : ""}
                  onChange={(e) =>
                    onFormChange({
                      ...formData,
                      archive_after: e.target.value ? localToUTC(e.target.value) : "",
                    })
                  }
                  className="h-12 bg-background border-border text-foreground rounded-xl focus:border-foreground/50"
                />
                <p className="text-xs text-muted-foreground">
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
            className="text-muted-foreground hover:text-foreground hover:bg-secondary"
          >
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            disabled={!formData.title || isSubmitting}
            className="font-semibold px-6 disabled:opacity-50 bg-foreground hover:bg-foreground/90 text-background"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4" />
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
