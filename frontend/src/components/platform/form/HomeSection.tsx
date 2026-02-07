"use client";

import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Trash2,
  ImageIcon,
  Link as LinkIcon,
  Upload,
} from "lucide-react";
import type { PlatformFormData, FeaturedImageFormData } from "./types";

interface HomeSectionProps {
  formData: PlatformFormData;
  onChange: (data: Partial<PlatformFormData>) => void;
  isReadOnly?: boolean;
}

export function HomeSection({
  formData,
  onChange,
  isReadOnly = false,
}: HomeSectionProps) {
  // Create a ref map for file inputs
  const fileInputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  const REQUIRED_WIDTH = 1920;
  const REQUIRED_HEIGHT = 600;
  const REQUIRED_RATIO = REQUIRED_WIDTH / REQUIRED_HEIGHT;
  const RATIO_TOLERANCE = 0.02; // 2%

  const [imageErrors, setImageErrors] = useState<Record<string, string>>({});

  // Featured image handlers
  const handleAddFeaturedImage = () => {
    const newImage: FeaturedImageFormData = {
      id: Date.now().toString(),
      url: "",
      alt: "",
      link: "",
      isExisting: false,
    };
    onChange({ featured_images: [...formData.featured_images, newImage] });
  };

  const handleDeleteFeaturedImage = (id: string) => {
    const imageToRemove = formData.featured_images.find((img) => img.id === id);
    if (imageToRemove?.url && imageToRemove.url.startsWith("blob:")) {
      URL.revokeObjectURL(imageToRemove.url);
    }
    onChange({
      featured_images: formData.featured_images.filter((img) => img.id !== id),
    });
  };

  const handleImageUpload = (id: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const img = new Image();
    img.src = URL.createObjectURL(file);

    img.onload = () => {
      const width = img.width;
      const height = img.height;
      const ratio = width / height;

      const isValidRatio = Math.abs(ratio - REQUIRED_RATIO) <= RATIO_TOLERANCE;

      if (!isValidRatio) {
        setImageErrors((prev) => ({
          ...prev,
          [id]: `Invalid image size. Required: ${REQUIRED_WIDTH}×${REQUIRED_HEIGHT}px (16:5 ratio).`,
        }));
        return;
      }

      setImageErrors((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });

      onChange({
        featured_images: formData.featured_images.map((imgData) =>
          imgData.id === id
            ? {
              ...imgData,
              file,
              url: URL.createObjectURL(file),
              isExisting: false,
            }
            : imgData
        ),
      });

    };
  };

  const handleImageLinkChange = (id: string, link: string) => {
    onChange({
      featured_images: formData.featured_images.map((img) =>
        img.id === id ? { ...img, link } : img
      ),
    });
  };

  const triggerFileInput = (id: string) => {
    const input = fileInputRefs.current.get(id);
    input?.click();
  };

  const setFileInputRef = (id: string, el: HTMLInputElement | null) => {
    if (el) {
      fileInputRefs.current.set(id, el);
    } else {
      fileInputRefs.current.delete(id);
    }
  };

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold text-foreground">Home Page Settings</h3>
        <p className="text-sm text-muted-foreground">
          Configure your platform home page banners
        </p>
      </div>

      {/* Banner Images */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
            <Label className="text-foreground/70 text-sm font-medium">
              Banner Images
            </Label>
            <Badge variant="secondary" className="text-xs">
              1920x600px (16:5)
            </Badge>
          </div>
          {!isReadOnly && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddFeaturedImage}
              className="bg-secondary border-border text-foreground hover:bg-muted"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Banner
            </Button>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          Upload banner images with resolution <strong>1920×600px</strong> (16:5 aspect ratio).
          Other image sizes are not supported.
        </p>

        {formData.featured_images.length === 0 ? (
          <div className="text-center p-8 rounded-xl bg-secondary/50 border border-dashed border-border">
            <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground mb-1">No banners added</p>
            <p className="text-xs text-muted-foreground mb-4">
              Add banner images to showcase on your home page
            </p>
            {!isReadOnly && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddFeaturedImage}
                className="bg-secondary border-border text-foreground hover:bg-muted"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Banner
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {formData.featured_images.map((image, index) => (
              <div
                key={image.id}
                className="p-4 rounded-xl bg-secondary border border-border space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-foreground">
                    Banner #{index + 1}
                  </h4>
                  {!isReadOnly && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteFeaturedImage(image.id)}
                      className="text-muted-foreground hover:text-foreground hover:bg-muted h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="flex items-start gap-4">
                  {/* Image Preview / Upload */}
                  <div
                    onClick={() => !isReadOnly && triggerFileInput(image.id)}
                    className={`relative w-48 h-24 rounded-lg border-2 border-dashed border-border bg-background flex items-center justify-center overflow-hidden ${!isReadOnly ? "cursor-pointer hover:border-foreground/50 hover:bg-muted/50" : ""
                      }`}
                  >
                    {image.url ? (
                      <img
                        src={image.url}
                        alt={image.alt || `Banner ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center">
                        <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
                        <span className="text-xs text-muted-foreground">Upload</span>
                      </div>
                    )}
                    <input
                      ref={(el) => setFileInputRef(image.id, el)}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(image.id, e)}
                      disabled={isReadOnly}
                      className="hidden"
                    />
                  </div>

                  {/* Image Link */}
                  <div className="flex-1 space-y-2">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <LinkIcon className="h-3 w-3" />
                      Link URL (optional)
                    </Label>
                    <Input
                      value={image.link || ""}
                      onChange={(e) => handleImageLinkChange(image.id, e.target.value)}
                      placeholder="https://example.com/page"
                      disabled={isReadOnly}
                      className="h-9 bg-background border-border text-foreground placeholder:text-muted-foreground rounded-lg"
                    />
                    <p className="text-xs text-muted-foreground">
                      Users will be redirected to this URL when clicking the banner
                    </p>
                  </div>
                </div>
                {imageErrors[image.id] && (
                  <p className="text-xs text-red-500 mt-1">
                    {imageErrors[image.id]}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

