"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  Globe,
  Mail,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTenant } from "@/hooks/useTenant";

export function Footer() {
  const { config, isLoading } = useTenant();

  if (isLoading) {
    return (
      <footer className="border-t bg-background mt-auto">
        <div className="container mx-auto py-8 px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
            <div className="flex flex-col items-start md:items-end space-y-4">
              <Skeleton className="h-8 w-32" />
              <div className="flex space-x-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </footer>
    );
  }

  const socialLinks = config?.social_links || [];
  const supportChannels = config?.support_channels || [];
  const footerPolicies = config?.footer_policies || {};

  const getSocialIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "facebook":
        return <Facebook className="h-4 w-4" />;
      case "twitter":
      case "x":
        return <Twitter className="h-4 w-4" />;
      case "instagram":
        return <Instagram className="h-4 w-4" />;
      case "linkedin":
        return <Linkedin className="h-4 w-4" />;
      case "youtube":
        return <Youtube className="h-4 w-4" />;
      default:
        return <Globe className="h-4 w-4" />;
    }
  };

  const getSupportIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "email":
        return <Mail className="h-4 w-4" />;
      case "phone":
      case "whatsapp":
        return <Phone className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const handleSupportClick = (channel: { type: string; value: string }) => {
    switch (channel.type.toLowerCase()) {
      case "phone":
        window.open(`tel:${channel.value}`, "_self");
        break;
      case "email":
        window.open(`mailto:${channel.value}`, "_self");
        break;
      case "whatsapp":
        window.open(
          `https://wa.me/${channel.value.replace(/\D/g, "")}`,
          "_blank"
        );
        break;
      default:
        break;
    }
  };

  return (
    <footer className="border-t bg-background mt-auto">
      <div className="container mx-auto py-8 px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left side - Links */}
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4 text-sm">
              <Link href="/about">
                <Button
                  variant="link"
                  className="p-0 h-auto text-muted-foreground hover:text-foreground"
                >
                  About
                </Button>
              </Link>
              {footerPolicies.terms_of_service && (
                <Link href="/terms">
                  <Button
                    variant="link"
                    className="p-0 h-auto text-muted-foreground hover:text-foreground"
                  >
                    Terms
                  </Button>
                </Link>
              )}
              {footerPolicies.privacy_policy && (
                <Link href="/privacy">
                  <Button
                    variant="link"
                    className="p-0 h-auto text-muted-foreground hover:text-foreground"
                  >
                    Privacy
                  </Button>
                </Link>
              )}
              {footerPolicies.refund_policy && (
                <Link href="/refund">
                  <Button
                    variant="link"
                    className="p-0 h-auto text-muted-foreground hover:text-foreground"
                  >
                    Refund
                  </Button>
                </Link>
              )}
              <Link href="/contact">
                <Button
                  variant="link"
                  className="p-0 h-auto text-muted-foreground hover:text-foreground"
                >
                  Contact
                </Button>
              </Link>
            </div>

            {/* Support channels */}
            {supportChannels.length > 0 && (
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {supportChannels.map((channel, index) => (
                  <button
                    key={index}
                    onClick={() => handleSupportClick(channel)}
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    {getSupportIcon(channel.type)}
                    <span>{channel.label || channel.value}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right side - Logo and Social */}
          <div className="flex flex-col items-start md:items-end space-y-4">
            {config?.logo_url && (
              <Image
                src={config.logo_url}
                alt={config.legal_name || "Logo"}
                width={120}
                height={40}
                className="h-8 w-auto object-contain"
              />
            )}

            {/* Social links */}
            {socialLinks.length > 0 && (
              <div className="flex space-x-2">
                {socialLinks.map((link, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => window.open(link.url, "_blank")}
                  >
                    {getSocialIcon(link.platform)}
                  </Button>
                ))}
              </div>
            )}

            {/* Copyright */}
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} {config?.legal_name || "Rekard"}.
              All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

