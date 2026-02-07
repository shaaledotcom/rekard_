"use client";

import React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEventDetails } from "@/hooks/useEventDetails";

interface EventDetailsSectionProps {
  description?: string;
}

export function EventDetailsSection({ description }: EventDetailsSectionProps) {
  const { displayHtml, shouldTruncate, isExpanded, toggleExpanded } =
    useEventDetails(description);

  if (!description) {
    return null;
  }

  return (
    <section className="rounded-lg mt-8">
      <div className="space-y-4">
        <div
          className="text-foreground/90 leading-relaxed prose prose-sm max-w-none dark:prose-invert prose-p:text-foreground/90 prose-headings:text-foreground prose-strong:text-foreground prose-a:text-primary space-y-5"
          dangerouslySetInnerHTML={{
            __html: displayHtml,
          }}
        />

        {shouldTruncate && (
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleExpanded}
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
}

