"use client";

import React, { useState, useMemo } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import DOMPurify from "dompurify";
import type { PublicEventDetails } from "@/store/api/dashboardApi";

interface EventDetailsSectionProps {
  description?: string;
  event?: PublicEventDetails | null;
}

const EventDetailsSection: React.FC<EventDetailsSectionProps> = ({
  description,
  event,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const fullDescription = event?.description || description || "";

  const getPlainTextLength = (html: string): number => {
    if (!html) return 0;
    if (typeof window === "undefined") {
      return html.replace(/<[^>]*>/g, "").length;
    }
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    return tempDiv.textContent?.length || 0;
  };

  const truncateHtml = (html: string, maxLength: number): string => {
    const plainTextLength = getPlainTextLength(html);
    if (plainTextLength <= maxLength) {
      return html;
    }

    if (typeof window === "undefined") {
      const text = html.replace(/<[^>]*>/g, "");
      const truncated = text.substring(0, maxLength);
      return truncated + "...";
    }

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;

    let text = "";
    let length = 0;

    const truncateNode = (node: Node): boolean => {
      if (length >= maxLength) return false;

      if (node.nodeType === Node.TEXT_NODE) {
        const nodeText = node.textContent || "";
        const remaining = maxLength - length;
        if (nodeText.length <= remaining) {
          text += nodeText;
          length += nodeText.length;
          return true;
        } else {
          text += nodeText.substring(0, remaining);
          length = maxLength;
          return false;
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element;
        const tagName = element.tagName.toLowerCase();
        const attrs = Array.from(element.attributes)
          .map((attr) => ` ${attr.name}="${attr.value}"`)
          .join("");
        const openTag = `<${tagName}${attrs}>`;
        const closeTag = `</${tagName}>`;

        text += openTag;
        let shouldClose = true;

        for (const child of Array.from(node.childNodes)) {
          if (!truncateNode(child)) {
            shouldClose = false;
            break;
          }
        }

        if (shouldClose && length < maxLength) {
          text += closeTag;
        }

        return length < maxLength;
      }

      return true;
    };

    for (const child of Array.from(tempDiv.childNodes)) {
      if (!truncateNode(child)) {
        break;
      }
    }

    return text + "...";
  };

  const { sanitizedHtml, shouldTruncate, truncatedHtml } = useMemo(() => {
    if (!fullDescription) {
      return { sanitizedHtml: "", shouldTruncate: false, truncatedHtml: "" };
    }

    const sanitized = DOMPurify.sanitize(fullDescription, {
      ALLOWED_TAGS: [
        "p",
        "br",
        "strong",
        "em",
        "u",
        "s",
        "h1",
        "h2",
        "h3",
        "ul",
        "ol",
        "li",
        "a",
        "div",
      ],
      ALLOWED_ATTR: ["href", "target", "rel", "style", "class"],
    });

    const plainTextLength = getPlainTextLength(sanitized);
    const shouldTruncate = plainTextLength > 600;
    const truncated = shouldTruncate ? truncateHtml(sanitized, 600) : sanitized;

    return {
      sanitizedHtml: sanitized,
      shouldTruncate,
      truncatedHtml: truncated,
    };
  }, [fullDescription]);

  if (!fullDescription) {
    return null;
  }

  return (
    <section className="rounded-lg mt-8">
      <div className="space-y-4">
        <div
          className="text-foreground/90 leading-relaxed prose prose-sm max-w-none dark:prose-invert prose-p:text-foreground/90 prose-headings:text-foreground prose-strong:text-foreground prose-a:text-primary"
          dangerouslySetInnerHTML={{
            __html: isExpanded ? sanitizedHtml : truncatedHtml,
          }}
        />

        {shouldTruncate && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-0 h-auto text-primary hover:text-primary/80"
          >
            {isExpanded ? (
              <>
                View less
                <ChevronUp className="ml-1 h-4 w-4" />
              </>
            ) : (
              <>
                View more
                <ChevronDown className="ml-1 h-4 w-4" />
              </>
            )}
          </Button>
        )}
      </div>
    </section>
  );
};

export default EventDetailsSection;

