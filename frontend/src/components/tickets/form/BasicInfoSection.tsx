"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Globe, Link, Info, CheckCircle2, AlertCircle, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePlan } from "@/hooks/usePlan";
import { useGetDomainSettingsQuery } from "@/store/api";
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
  const { toast } = useToast();
  const { hasProFeatures } = usePlan();
  const { data: domainSettingsData } = useGetDomainSettingsQuery(undefined, {
    skip: !hasProFeatures, // Only fetch if user has pro features
  });
  
  // Track if user has manually edited the URL field
  // Start as true if there's already a URL (editing existing ticket)
  const [urlManuallyEdited, setUrlManuallyEdited] = useState(false);
  const initialUrlRef = useRef<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  // Determine the base URL for the ticket
  const getBaseUrl = (): string => {
    // If pro plan is enabled and domain is present, use custom domain
    if (hasProFeatures && domainSettingsData?.data?.domain) {
      return domainSettingsData.data.domain;
    }
    // Default to watch.rekard.com
    return "watch.rekard.com";
  };
  
  const baseUrl = getBaseUrl();
  
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

  const handleCopyUrl = async () => {
    const fullUrl = `${baseUrl}/${formData.url}`;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      toast({
        title: "URL Copied!",
        description: "Ticket URL has been copied to clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy URL to clipboard.",
        variant: "destructive",
      });
    }
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
          {isUrlValid && formData.url ? (
            <div className="flex items-center gap-2 p-3 bg-secondary rounded-lg border border-border">
              <div className="flex items-start gap-2 flex-1 min-w-0">
                <Link className="h-3 w-3 mt-0.5 flex-shrink-0 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground mb-1">Your ticket will be available at:</p>
                  <p 
                    className="text-sm font-mono text-foreground select-all break-all cursor-text"
                    onClick={(e) => {
                      const selection = window.getSelection();
                      const range = document.createRange();
                      range.selectNodeContents(e.currentTarget);
                      selection?.removeAllRanges();
                      selection?.addRange(range);
                    }}
                  >
                    {baseUrl}/{formData.url}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCopyUrl}
                className="h-8 w-8 p-0 flex-shrink-0"
                title="Copy URL"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          ) : (
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <Link className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <p>
                URL should contain only lowercase letters, numbers, and hyphens.
              </p>
            </div>
          )}
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

