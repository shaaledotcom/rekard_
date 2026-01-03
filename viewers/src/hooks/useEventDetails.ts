import { useState, useMemo } from "react";
import DOMPurify from "dompurify";

/**
 * Custom hook for EventDetailsSection business logic
 * 
 * BUSINESS LOGIC OVERVIEW:
 * 
 * 1. HTML SANITIZATION:
 *    - Sanitizes HTML content using DOMPurify to prevent XSS attacks
 *    - Allows safe HTML tags (p, br, strong, em, headings, lists, links)
 *    - Preserves essential attributes (href, target, rel, style, class)
 *    - Strips potentially dangerous content while maintaining formatting
 * 
 * 2. HTML TRUNCATION:
 *    - Truncates HTML content while preserving structure and tags
 *    - Uses recursive DOM traversal to maintain valid HTML
 *    - Truncates based on plain text length (600 characters)
 *    - Preserves opening/closing tags for proper rendering
 *    - Adds ellipsis when content is truncated
 * 
 * 3. PLAIN TEXT LENGTH CALCULATION:
 *    - Calculates actual text length excluding HTML tags
 *    - Works in both SSR and client-side environments
 *    - Uses regex fallback for SSR, DOM parsing for client
 * 
 * 4. EXPAND/COLLAPSE STATE:
 *    - Manages expanded/collapsed state for long descriptions
 *    - Shows truncated version by default, full content when expanded
 *    - Only shows expand/collapse button when content exceeds threshold
 */
export function useEventDetails(description?: string, truncateLength: number = 600) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate plain text length (works in SSR and client)
  const getPlainTextLength = (html: string): number => {
    if (!html) return 0;
    if (typeof window === "undefined") {
      return html.replace(/<[^>]*>/g, "").length;
    }
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    return tempDiv.textContent?.length || 0;
  };

  // Truncate HTML while preserving structure
  const truncateHtml = (html: string, maxLength: number): string => {
    const plainTextLength = getPlainTextLength(html);
    if (plainTextLength <= maxLength) {
      return html;
    }

    // SSR fallback: simple text truncation
    if (typeof window === "undefined") {
      const text = html.replace(/<[^>]*>/g, "");
      const truncated = text.substring(0, maxLength);
      return truncated + "...";
    }

    // Client-side: preserve HTML structure while truncating
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;

    let text = "";
    let length = 0;

    // Recursively truncate nodes while preserving HTML structure
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

        // Recursively process child nodes
        for (const child of Array.from(node.childNodes)) {
          if (!truncateNode(child)) {
            shouldClose = false;
            break;
          }
        }

        // Close tag only if we didn't hit the limit
        if (shouldClose && length < maxLength) {
          text += closeTag;
        }

        return length < maxLength;
      }

      return true;
    };

    // Process all top-level nodes
    for (const child of Array.from(tempDiv.childNodes)) {
      if (!truncateNode(child)) {
        break;
      }
    }

    return text + "...";
  };

  // Process description: sanitize, truncate, and determine if truncation is needed
  const { sanitizedHtml, shouldTruncate, truncatedHtml } = useMemo(() => {
    if (!description) {
      return { sanitizedHtml: "", shouldTruncate: false, truncatedHtml: "" };
    }

    // Sanitize HTML to prevent XSS attacks
    const sanitized = DOMPurify.sanitize(description, {
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
    const shouldTruncate = plainTextLength > truncateLength;
    const truncated = shouldTruncate
      ? truncateHtml(sanitized, truncateLength)
      : sanitized;

    return {
      sanitizedHtml: sanitized,
      shouldTruncate,
      truncatedHtml: truncated,
    };
  }, [description, truncateLength]);

  // Toggle expand/collapse state
  const toggleExpanded = () => {
    setIsExpanded((prev) => !prev);
  };

  // Get current HTML to display (truncated or full)
  const displayHtml = isExpanded ? sanitizedHtml : truncatedHtml;

  return {
    displayHtml,
    shouldTruncate,
    isExpanded,
    toggleExpanded,
  };
}

