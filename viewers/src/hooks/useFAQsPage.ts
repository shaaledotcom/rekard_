import { useTenant } from "@/hooks/useTenant";

export interface FAQItem {
  question: string;
  answer: string;
}

/**
 * Custom hook for FAQs page business logic
 * 
 * BUSINESS LOGIC OVERVIEW:
 * 
 * 1. FAQ CONTENT PARSING:
 *    - Supports multiple formats: JSON array, Q&A text format, or plain text
 *    - JSON format: Array of {question, answer} objects (structured data)
 *    - Q&A format: "Q: Question\nA: Answer" pattern (user-friendly text)
 *    - Plain text: Falls back to single FAQ item with generic title
 *    - Ensures flexibility for different content management approaches
 * 
 * 2. SUPPORT CHANNEL URL GENERATION:
 *    - Generates appropriate URLs based on channel type (email, phone, WhatsApp)
 *    - Email: mailto: links for email clients
 *    - Phone: tel: links for dialing
 *    - WhatsApp: WhatsApp web links with sanitized phone numbers
 *    - Other types: Uses value as-is for custom URLs
 * 
 * 3. CONTENT DISPLAY LOGIC:
 *    - Shows empty state when no FAQ content is available
 *    - Uses tenant-configured title or defaults to "Frequently Asked Questions"
 *    - Displays support channels section when available for additional help
 */
export function useFAQsPage() {
  const { config, isLoading, error } = useTenant();

  const faqsContent = config?.footer_policies?.faqs?.content || "";
  const faqsTitle = config?.footer_policies?.faqs?.title || "Frequently Asked Questions";
  const faqItems = parseFAQContent(faqsContent);
  const supportChannels = config?.support_channels || [];

  // Generate support channel URLs based on type
  const supportChannelsWithUrls = supportChannels.map((channel) => {
    let href = channel.value;
    let target: string | undefined;
    let rel: string | undefined;

    if (channel.type === "email") {
      href = `mailto:${channel.value}`;
    } else if (channel.type === "phone") {
      href = `tel:${channel.value}`;
    } else if (channel.type === "whatsapp") {
      href = `https://wa.me/${channel.value.replace(/\D/g, "")}`;
      target = "_blank";
      rel = "noopener noreferrer";
    }

    return {
      ...channel,
      href,
      target,
      rel,
      label: channel.label || channel.type.charAt(0).toUpperCase() + channel.type.slice(1),
    };
  });

  return {
    isLoading,
    error,
    faqsContent,
    faqsTitle,
    faqItems,
    supportChannels: supportChannelsWithUrls,
    hasFAQs: !!faqsContent,
  };
}

/**
 * Parse FAQ content from various formats
 * Priority: JSON array > Q&A format > plain text
 */
function parseFAQContent(content: string): FAQItem[] {
  if (!content) return [];

  // Try JSON format first (structured FAQ data)
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (item) => item.question && item.answer
      ) as FAQItem[];
    }
  } catch {
    // Not JSON, continue to text parsing
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
      // Save previous Q&A pair if exists
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

  // Save last Q&A pair
  if (currentQuestion && currentAnswer) {
    matches.push({
      question: currentQuestion.trim(),
      answer: currentAnswer.trim(),
    });
  }

  if (matches.length > 0) {
    return matches;
  }

  // Fallback: return as single content block
  return [
    {
      question: "Frequently Asked Questions",
      answer: content,
    },
  ];
}

