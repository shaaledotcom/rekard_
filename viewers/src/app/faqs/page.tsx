"use client";

import React from "react";
import { MainLayout } from "@/components/layout";
import { useTenant } from "@/providers/TenantProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface FAQItem {
  question: string;
  answer: string;
}

// Parse FAQ content - supports both plain text and structured Q&A format
function parseFAQContent(content: string): FAQItem[] {
  if (!content) return [];

  // Try to parse as JSON first (structured FAQ)
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (item) => item.question && item.answer
      ) as FAQItem[];
    }
  } catch {
    // Not JSON, parse as text
  }

  // Parse Q&A format: "Q: Question\nA: Answer"
  const lines = content.split('\n');
  const matches: FAQItem[] = [];
  let currentQuestion = '';
  let currentAnswer = '';
  let isReadingAnswer = false;

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine.toLowerCase().startsWith('q:')) {
      // If we have a previous Q&A pair, save it
      if (currentQuestion && currentAnswer) {
        matches.push({
          question: currentQuestion.trim(),
          answer: currentAnswer.trim(),
        });
      }
      currentQuestion = trimmedLine.substring(2).trim();
      currentAnswer = '';
      isReadingAnswer = false;
    } else if (trimmedLine.toLowerCase().startsWith('a:')) {
      currentAnswer = trimmedLine.substring(2).trim();
      isReadingAnswer = true;
    } else if (isReadingAnswer && trimmedLine) {
      currentAnswer += '\n' + trimmedLine;
    }
  }

  // Don't forget the last Q&A pair
  if (currentQuestion && currentAnswer) {
    matches.push({
      question: currentQuestion.trim(),
      answer: currentAnswer.trim(),
    });
  }

  if (matches.length > 0) {
    return matches;
  }

  // Return as single content block
  return [
    {
      question: "Frequently Asked Questions",
      answer: content,
    },
  ];
}

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
  const { config, isLoading, error } = useTenant();

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

  const faqsContent = config?.footer_policies?.faqs?.content || "";
  const faqsTitle = config?.footer_policies?.faqs?.title || "Frequently Asked Questions";
  const faqItems = parseFAQContent(faqsContent);

  if (!faqsContent && !error) {
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

        {/* Contact Section */}
        {config?.support_channels && config.support_channels.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Still have questions?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Can't find what you're looking for? Contact our support team.
              </p>
              <div className="flex flex-wrap gap-4">
                {config.support_channels.map((channel, index) => (
                  <a
                    key={index}
                    href={
                      channel.type === "email"
                        ? `mailto:${channel.value}`
                        : channel.type === "phone"
                        ? `tel:${channel.value}`
                        : channel.type === "whatsapp"
                        ? `https://wa.me/${channel.value.replace(/\D/g, "")}`
                        : channel.value
                    }
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 rounded-lg text-primary transition-colors text-sm"
                    target={channel.type === "whatsapp" ? "_blank" : undefined}
                    rel={channel.type === "whatsapp" ? "noopener noreferrer" : undefined}
                  >
                    {channel.label || channel.type.charAt(0).toUpperCase() + channel.type.slice(1)}
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

