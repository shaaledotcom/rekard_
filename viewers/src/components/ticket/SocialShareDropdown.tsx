"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Share2,
  Facebook,
  Twitter,
  Linkedin,
  Mail,
  Copy,
  MessageCircle,
  Instagram,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SocialShareDropdownProps {
  url: string;
  title: string;
  description?: string;
}

export function SocialShareDropdown({
  url,
  title,
  description,
}: SocialShareDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const shareData = {
    title: title,
    text: description || `Check out this event: ${title}`,
    url: url,
  };

  const handleShare = async (platform: string) => {
    try {
      switch (platform) {
        case "facebook":
          window.open(
            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
            "_blank"
          );
          break;
        case "twitter":
          const twitterText = `${title} - ${url}`;
          window.open(
            `https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterText)}`,
            "_blank"
          );
          break;
        case "linkedin":
          window.open(
            `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
            "_blank"
          );
          break;
        case "email":
          const subject = `Check out this event: ${title}`;
          const body = `I thought you might be interested in this event: ${title}\n\n${url}`;
          window.open(
            `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
            "_blank"
          );
          break;
        case "whatsapp":
          const whatsappText = `${title} - ${url}`;
          window.open(
            `https://wa.me/?text=${encodeURIComponent(whatsappText)}`,
            "_blank"
          );
          break;
        case "instagram":
          await navigator.clipboard.writeText(url);
          toast({
            title: "Link copied!",
            description: "You can now paste it in Instagram",
          });
          break;
        case "copy":
          await navigator.clipboard.writeText(url);
          toast({
            title: "Link copied!",
            description: "Link copied to clipboard",
          });
          break;
        case "native":
          if (navigator.share) {
            await navigator.share(shareData);
          } else {
            await navigator.clipboard.writeText(url);
            toast({
              title: "Link copied!",
              description: "Link copied to clipboard",
            });
          }
          break;
      }
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to share:", error);
      toast({
        title: "Error",
        description: "Failed to share",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Share2
        className="h-8 w-8 mb-2 cursor-pointer hover:text-primary transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      />

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-card border rounded-lg shadow-lg z-50">
          <div className="p-2 space-y-1">
            <button
              onClick={() => handleShare("native")}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted rounded-md transition-colors"
            >
              <Share2 className="h-4 w-4" />
              Share via...
            </button>

            <button
              onClick={() => handleShare("facebook")}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted rounded-md transition-colors"
            >
              <Facebook className="h-4 w-4 text-blue-600" />
              Facebook
            </button>

            <button
              onClick={() => handleShare("twitter")}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted rounded-md transition-colors"
            >
              <Twitter className="h-4 w-4 text-blue-400" />
              Twitter
            </button>

            <button
              onClick={() => handleShare("linkedin")}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted rounded-md transition-colors"
            >
              <Linkedin className="h-4 w-4 text-blue-700" />
              LinkedIn
            </button>

            <button
              onClick={() => handleShare("whatsapp")}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted rounded-md transition-colors"
            >
              <MessageCircle className="h-4 w-4 text-green-600" />
              WhatsApp
            </button>

            <button
              onClick={() => handleShare("instagram")}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted rounded-md transition-colors"
            >
              <Instagram className="h-4 w-4 text-pink-600" />
              Instagram
            </button>

            <button
              onClick={() => handleShare("email")}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted rounded-md transition-colors"
            >
              <Mail className="h-4 w-4" />
              Email
            </button>

            <button
              onClick={() => handleShare("copy")}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted rounded-md transition-colors"
            >
              <Copy className="h-4 w-4" />
              Copy Link
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

