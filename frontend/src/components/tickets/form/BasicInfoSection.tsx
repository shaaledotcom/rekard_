"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Badge } from "@/components/ui/badge";
import { Globe, Link, Info, CheckCircle2, AlertCircle } from "lucide-react";
import type { TicketFormData } from "./types";

interface BasicInfoSectionProps {
  formData: TicketFormData;
  onChange: (data: Partial<TicketFormData>) => void;
  isReadOnly?: boolean;
}

export function BasicInfoSection({
  formData,
  onChange,
  isReadOnly = false,
}: BasicInfoSectionProps) {
  // Track if user has manually edited the URL field
  // Start as true if there's already a URL (editing existing ticket)
  const [urlManuallyEdited, setUrlManuallyEdited] = useState(false);
  const initialUrlRef = useRef<string | null>(null);
  
  // On mount, if there's already a URL, consider it "manually edited" to preserve it
  useEffect(() => {
    if (initialUrlRef.current === null && formData.url) {
      initialUrlRef.current = formData.url;
      setUrlManuallyEdited(true);
    }
  }, [formData.url]);

  // Auto-generate URL slug from title
  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  // Handle title change - auto-generate URL slug while user hasn't manually edited it
  const handleTitleChange = (value: string) => {
    // Auto-generate URL from title unless user has manually edited the URL field
    if (!urlManuallyEdited) {
      const slug = generateSlug(value);
      // Update both title and URL in a single onChange call
      onChange({ title: value, url: slug });
    } else {
      // User has manually edited URL, so only update the title
      onChange({ title: value });
    }
  };

  const handleUrlChange = (value: string) => {
    setUrlManuallyEdited(true);
    onChange({ url: value });
  };

  const handleDescriptionChange = (value: string) => {
    onChange({ description: value });
  };

  // Validation helpers
  const isTitleValid = formData.title.length >= 3;
  const isUrlValid = formData.url.length >= 3 && /^[a-z0-9-]+$/.test(formData.url);

  const getPlainTextLength = (html: string): number => {
    if (!html) return 0;
    if (typeof window === "undefined") {
      return html.replace(/<[^>]*>/g, "").length;
    }
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    return tempDiv.textContent?.length || 0;
  };

  const descriptionLength = getPlainTextLength(formData.description);
  const isDescriptionValid = descriptionLength <= 500;

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold text-foreground">Basic Information</h3>
        <p className="text-sm text-muted-foreground">
          Start by providing the essential details for your ticket
        </p>
      </div>

      <div className="space-y-6">
        {/* Title Field */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-foreground/70 text-sm font-medium">Title *</Label>
            <Badge 
              variant={isTitleValid ? "default" : "secondary"}
              className="text-xs"
            >
              {formData.title.length}/50
            </Badge>
          </div>
          <div className="relative">
            <Input
              value={formData.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Enter an engaging title for your ticket"
              disabled={isReadOnly}
              maxLength={50}
              className={`h-12 bg-secondary border-border text-foreground placeholder:text-muted-foreground rounded-xl pr-10 ${
                formData.title.length > 0 
                  ? isTitleValid 
                    ? "border-foreground/50 focus:border-foreground" 
                    : "border-foreground/30 focus:border-foreground/50"
                  : "focus:border-foreground/50"
              }`}
            />
            {formData.title.length > 0 && (
              <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                {isTitleValid ? (
                  <CheckCircle2 className="h-4 w-4 text-foreground" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            )}
          </div>
          {formData.title.length > 0 && (
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <p>
                {isTitleValid 
                  ? "Great! This title will help attract viewers."
                  : "Title should be at least 3 characters long."
                }
              </p>
            </div>
          )}
        </div>

        {/* URL Field */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-foreground/70 text-sm font-medium">URL Slug *</Label>
            <Badge 
              variant={isUrlValid ? "default" : "secondary"}
              className="text-xs"
            >
              {formData.url.length}/30
            </Badge>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4">
              <Globe className="h-4 w-4 text-muted-foreground" />
            </div>
            <Input
              value={formData.url}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="your-ticket-url"
              disabled={isReadOnly}
              maxLength={30}
              className={`h-12 pl-11 bg-secondary border-border text-foreground placeholder:text-muted-foreground rounded-xl pr-10 ${
                formData.url.length > 0 
                  ? isUrlValid 
                    ? "border-foreground/50 focus:border-foreground" 
                    : "border-foreground/30 focus:border-foreground/50"
                  : "focus:border-foreground/50"
              }`}
            />
            {formData.url.length > 0 && (
              <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                {isUrlValid ? (
                  <CheckCircle2 className="h-4 w-4 text-foreground" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            )}
          </div>
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <Link className="h-3 w-3 mt-0.5 flex-shrink-0" />
            <p>
              {isUrlValid 
                ? `Your ticket will be available at: watch.rekard.com/${formData.url}`
                : "URL should contain only lowercase letters, numbers, and hyphens."
              }
            </p>
          </div>
        </div>

        {/* Description Field */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-foreground/70 text-sm font-medium">Description</Label>
            <Badge 
              variant={isDescriptionValid ? "default" : "destructive"}
              className="text-xs"
            >
              {descriptionLength}/500
            </Badge>
          </div>
          <RichTextEditor
            value={formData.description}
            onChange={handleDescriptionChange}
            placeholder="Describe what viewers can expect from this ticket..."
            disabled={isReadOnly}
          />
          {descriptionLength > 0 && (
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <p>
                {isDescriptionValid 
                  ? "Good description! This helps viewers understand what they're purchasing."
                  : "Description is too long. Keep it under 500 characters."
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

