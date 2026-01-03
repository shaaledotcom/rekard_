"use client";

import React, { useState } from "react";
import { MainLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useFAQsPage, FAQItem } from "@/hooks/useFAQsPage";

function FAQAccordion({ items }: { items: FAQItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (items.length === 0) {
    return null;
  }

  // If single item with generic question, just show the content
  if (items.length === 1 && items[0].question === "Frequently Asked Questions") {
    return (
      <div className="prose prose-sm sm:prose max-w-none dark:prose-invert">
        <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
          {items[0].answer}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div
          key={index}
          className="border rounded-lg overflow-hidden bg-card"
        >
          <button
            className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
          >
            <span className="font-medium text-sm sm:text-base pr-4">
              {item.question}
            </span>
            {openIndex === index ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            )}
          </button>
          {openIndex === index && (
            <div className="px-4 pb-4 text-muted-foreground text-sm leading-relaxed">
              <p className="whitespace-pre-wrap">{item.answer}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function FAQsPage() {
  const {
    isLoading,
    error,
    faqsTitle,
    faqItems,
    supportChannels,
    hasFAQs,
  } = useFAQsPage();

  if (isLoading) {
    return (
      <MainLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!hasFAQs && !error) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto py-8 px-4">
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <HelpCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">No FAQs Available</h2>
                <p className="text-muted-foreground">
                  Frequently asked questions will appear here when available.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto py-8 px-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <HelpCircle className="w-8 h-8 text-primary" />
              <CardTitle className="text-2xl sm:text-3xl font-bold">
                {faqsTitle}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <FAQAccordion items={faqItems} />
          </CardContent>
        </Card>

        {supportChannels.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Still have questions?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Can't find what you're looking for? Contact our support team.
              </p>
              <div className="flex flex-wrap gap-4">
                {supportChannels.map((channel, index) => (
                  <a
                    key={index}
                    href={channel.href}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 rounded-lg text-primary transition-colors text-sm"
                    target={channel.target}
                    rel={channel.rel}
                  >
                    {channel.label}
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}

