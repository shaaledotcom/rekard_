"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  X,
  Image as ImageIcon,
  Video,
  FileImage,
  Info,
} from "lucide-react";
import type { TicketFormData, MediaFiles } from "./types";

interface MediaSectionProps {
  formData: TicketFormData;
  mediaFiles: MediaFiles;
  onChange: (data: Partial<TicketFormData>) => void;
  onMediaFilesChange: (files: MediaFiles) => void;
  isReadOnly?: boolean;
}

interface MediaField {
  key: keyof MediaFiles;
  formKey: "thumbnail_image_portrait" | "featured_image" | "featured_video";
  label: string;
  description: string;
  icon: React.ReactNode;
  accept: string;
  maxSize: number;
  dimensions?: string;
  isVideo?: boolean;
}

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/ogg"];

const IMAGE_RULES = {
  thumbnailImagePortrait: {
    minWidth: 1080,
    minHeight: 1920,
    ratio: 9 / 16,
    label: "Portrait image must be 9:16 (min 1080×1920px)",
  },
  featuredImage: {
    minWidth: 1920,
    minHeight: 1080,
    ratio: 16 / 9,
    label: "Featured image must be 16:9 (min 1920×1080px)",
  },
};

const RATIO_TOLERANCE = 0.02;

const MEDIA_FIELDS: MediaField[] = [
  {
    key: "thumbnailImagePortrait",
    formKey: "thumbnail_image_portrait",
    label: "Thumbnail Image",
    description: "Portrait orientation for mobile viewing",
    icon: <FileImage className="h-5 w-5" />,
    accept: "image/*",
    maxSize: MAX_IMAGE_SIZE,
    dimensions: "1080 × 1920px"
  },
  {
    key: "featuredImage",
    formKey: "featured_image",
    label: "Featured Image",
    description: "Main promotional image",
    icon: <ImageIcon className="h-5 w-5" />,
    accept: "image/*",
    maxSize: MAX_IMAGE_SIZE,
    dimensions: "1920 × 1080px"
  },
  {
    key: "featuredVideo",
    formKey: "featured_video",
    label: "Featured Video / Trailer",
    description: "Promotional video content",
    icon: <Video className="h-5 w-5" />,
    accept: "video/*",
    maxSize: MAX_VIDEO_SIZE,
    isVideo: true,
  }
];

export function MediaSection({
  formData,
  mediaFiles,
  onChange,
  onMediaFilesChange,
  isReadOnly = false,
}: MediaSectionProps) {
  const [dragOver, setDragOver] = useState<string | null>(null);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const [imageErrors, setImageErrors] = useState<Record<string, string>>({});

  const validateFile = (file: File, allowedTypes: string[], maxSize: number): string | null => {
    if (!allowedTypes.includes(file.type)) {
      return `File type ${file.type} is not supported`;
    }
    if (file.size > maxSize) {
      return `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`;
    }
    return null;
  };

  const validateImageResolution = (
    file: File,
    fieldKey: string
  ): Promise<string | null> => {
    return new Promise((resolve) => {
      const rule = IMAGE_RULES[fieldKey as keyof typeof IMAGE_RULES];
      if (!rule) return resolve(null); // videos or unsupported fields

      const img = new Image();
      img.src = URL.createObjectURL(file);

      img.onload = () => {
        const { width, height } = img;
        const ratio = width / height;

        const validRatio = Math.abs(ratio - rule.ratio) <= RATIO_TOLERANCE;
        const validSize = width >= rule.minWidth && height >= rule.minHeight;

        URL.revokeObjectURL(img.src);

        if (!validRatio || !validSize) {
          resolve(rule.label);
        } else {
          resolve(null);
        }
      };
    });
  };

  const handleFileChange = useCallback(async (
    event: React.ChangeEvent<HTMLInputElement>,
    field: MediaField
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = field.isVideo ? ALLOWED_VIDEO_TYPES : ALLOWED_IMAGE_TYPES;
    const error = validateFile(file, allowedTypes, field.maxSize);

    if (error) {
      setImageErrors((prev) => ({ ...prev, [field.key]: error }));
      // Reset input value even on error so user can try again
      if (fileInputRefs.current[field.key]) {
        fileInputRefs.current[field.key]!.value = "";
      }
      return;
    }

    if (!field.isVideo) {
      const resolutionError = await validateImageResolution(file, field.key);
      if (resolutionError) {
        setImageErrors((prev) => ({
          ...prev,
          [field.key]: resolutionError,
        }));
        return;
      }
    }

    // clear error
    setImageErrors((prev) => {
      const copy = { ...prev };
      delete copy[field.key];
      return copy;
    });

    // Update media files
    const newMediaFiles = {
      ...mediaFiles,
      [field.key]: file,
    };
    onMediaFilesChange(newMediaFiles);

    // Clear existing URL
    onChange({ [field.formKey]: undefined });

    // Reset input value to allow selecting the same file again
    if (fileInputRefs.current[field.key]) {
      fileInputRefs.current[field.key]!.value = "";
    }
  }, [mediaFiles, onMediaFilesChange, onChange]);

  const removeFile = useCallback((field: MediaField) => {
    const newMediaFiles = { ...mediaFiles };
    delete newMediaFiles[field.key];
    onMediaFilesChange(newMediaFiles);

    onChange({ [field.formKey]: undefined });

    setImageErrors((prev) => {
      const copy = { ...prev };
      delete copy[field.key];
      return copy;
    });

    if (fileInputRefs.current[field.key]) {
      fileInputRefs.current[field.key]!.value = "";
    }
  }, [mediaFiles, onMediaFilesChange, onChange]);

  const handleDragOver = useCallback((e: React.DragEvent, fieldKey: string) => {
    e.preventDefault();
    setDragOver(fieldKey);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(null);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, field: MediaField) => {
    e.preventDefault();
    setDragOver(null);

    const file = e.dataTransfer.files[0];
    if (!file) return;

    const allowedTypes = field.isVideo ? ALLOWED_VIDEO_TYPES : ALLOWED_IMAGE_TYPES;
    const error = validateFile(file, allowedTypes, field.maxSize);

    if (error) {
      setImageErrors((prev) => ({ ...prev, [field.key]: error }));
      return;
    }

    if (!field.isVideo) {
      const resolutionError = await validateImageResolution(file, field.key);
      if (resolutionError) {
        setImageErrors((prev) => ({
          ...prev,
          [field.key]: resolutionError,
        }));
        return;
      }
    }

    const newMediaFiles = {
      ...mediaFiles,
      [field.key]: file,
    };
    onMediaFilesChange(newMediaFiles);
    onChange({ [field.formKey]: undefined });
  }, [mediaFiles, onMediaFilesChange, onChange]);

  const getPreview = (field: MediaField) => {
    const file = mediaFiles[field.key];
    const existingUrl = formData[field.formKey];

    if (file) {
      const preview = URL.createObjectURL(file);
      if (field.isVideo) {
        return (
          <video className="w-full h-48 object-cover rounded-lg" controls src={preview} />
        );
      }
      if (field.key === "thumbnailImagePortrait") {
        return (
          <img className="w-32 h-48 object-cover rounded-lg mx-auto" src={preview} alt="Preview" />
        );
      }
      return (
        <img className="w-full h-auto max-h-48 object-contain rounded-lg" src={preview} alt="Preview" />
      );
    }

    if (existingUrl) {
      if (field.isVideo) {
        return (
          <video className="w-full h-48 object-cover rounded-lg" controls src={existingUrl} />
        );
      }
      if (field.key === "thumbnailImagePortrait") {
        return (
          <img className="w-32 h-48 object-cover rounded-lg mx-auto" src={existingUrl} alt="Preview" />
        );
      }
      return (
        <img className="w-full h-auto max-h-48 object-contain rounded-lg" src={existingUrl} alt="Preview" />
      );
    }

    return null;
  };

  const getFileInfo = (field: MediaField) => {
    const file = mediaFiles[field.key];
    if (!file) return null;
    const sizeInMB = (file.size / 1024 / 1024).toFixed(2);
    return (
      <div className="text-xs text-muted-foreground mt-2">
        <p>{file.name}</p>
        <p>Size: {sizeInMB}MB</p>
      </div>
    );
  };

  const hasMedia = (field: MediaField) => {
    return mediaFiles[field.key] || formData[field.formKey];
  };

  return (
    <div className="space-y-8 mt-10">
      {/* Section Header */}
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold text-foreground">Media Assets</h3>
        <p className="text-sm text-muted-foreground">
          Upload images and videos to showcase your ticket
        </p>
      </div>

      {/* Media Upload Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MEDIA_FIELDS.map((field) => {
          const isDragOver = dragOver === field.key;
          const hasFile = hasMedia(field);

          return (
            <div key={field.key} className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-foreground/70 text-sm font-medium flex items-center gap-2">
                  {field.icon}
                  <span>{field.label}</span>
                </Label>
                {field.dimensions && (
                  <Badge variant="secondary" className="text-xs">
                    {field.dimensions}
                  </Badge>
                )}
              </div>

              {!hasFile ? (
                <div
                  className={`relative border-2 border-dashed rounded-xl p-6 text-center ${isDragOver
                    ? "border-foreground bg-secondary"
                    : "border-border hover:border-foreground/50 bg-secondary"
                    }`}
                  onDragOver={(e) => handleDragOver(e, field.key)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, field)}
                >
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm font-medium text-foreground/70 mb-1">
                    {isDragOver ? "Drop file here" : "Drag & drop or click"}
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    {field.description}
                  </p>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRefs.current[field.key]?.click()}
                    disabled={isReadOnly}
                    className="w-full bg-background border-border text-foreground hover:bg-muted"
                  >
                    Choose File
                  </Button>

                  <input
                    ref={(el) => {
                      fileInputRefs.current[field.key] = el;
                    }}
                    type="file"
                    accept={field.accept}
                    onChange={(e) => handleFileChange(e, field)}
                    disabled={isReadOnly}
                    className="hidden"
                  />
                  {
                    imageErrors[field.key] && (
                      <p className="text-xs text-red-500 mt-2">
                        {imageErrors[field.key]}
                      </p>
                    )
                  }
                </div>
              ) : (
                <div className="space-y-3 p-4 rounded-xl bg-secondary border border-border">
                  <div className="relative">
                    {getPreview(field)}
                    {!isReadOnly && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8"
                        onClick={() => removeFile(field)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {getFileInfo(field)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Media Guidelines */}
      <div className="bg-secondary rounded-xl p-4 border border-border">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-foreground mt-0.5 flex-shrink-0" />
          <div className="text-sm text-foreground/70">
            <h4 className="font-medium mb-1 text-foreground">Media Guidelines</h4>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>• Images: JPEG, PNG, WebP up to 10MB</li>
              <li>• Videos: MP4, WebM, OGG up to 50MB</li>
              <li>• Thumbnail should be portrait orientation (9:16) for mobile</li>
              <li>• Featured image works best in landscape format (16:9)</li>
              <li>• High-quality media improves ticket appeal</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

