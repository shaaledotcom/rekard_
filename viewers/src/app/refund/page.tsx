"use client";

import { MainLayout } from "@/components/layout";
import { useTenant } from "@/hooks/useTenant";
import { Skeleton } from "@/components/ui/skeleton";

export default function RefundPage() {
  const { config, isLoading } = useTenant();

  const refundPolicy = config?.footer_policies?.refund_policy;
  const legalName = config?.legal_name || "Rekard Media Pvt Ltd";

  if (isLoading) {
    return (
      <MainLayout>
        <div className="max-w-3xl mx-auto py-8 space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <article className="max-w-3xl mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">
          {refundPolicy?.title || "Refund Policy"}
        </h1>

        <div className="prose prose-sm dark:prose-invert max-w-none">
          {refundPolicy?.content ? (
            <div dangerouslySetInnerHTML={{ __html: refundPolicy.content }} />
          ) : (
            <DefaultRefundContent legalName={legalName} />
          )}
        </div>

        <p className="text-sm text-muted-foreground mt-8">
          Last updated: {new Date().toLocaleDateString()}
        </p>
      </article>
    </MainLayout>
  );
}

function DefaultRefundContent({ legalName }: { legalName: string }) {
  return (
    <>
      <p>
        At {legalName}, we strive to ensure your satisfaction with every purchase. Please review our refund policy below.
      </p>

      <h2>1. Digital Content Policy</h2>
      <p>
        Due to the nature of digital content and live streaming services, all sales are generally final. Once you have purchased access to an event or content, refunds are typically not available.
      </p>

      <h2>2. When Refunds May Be Available</h2>
      <p>Refunds may be considered in the following circumstances:</p>
      <ul>
        <li>Event cancellation by the organizer</li>
        <li>Technical issues on our platform that prevent access to purchased content</li>
        <li>Duplicate purchases made in error</li>
        <li>Unauthorized transactions (subject to investigation)</li>
      </ul>

      <h2>3. Event Cancellation</h2>
      <p>
        If an event is cancelled by the organizer, you will be entitled to a full refund. Refunds will be processed within 7-10 business days to your original payment method.
      </p>

      <h2>4. Event Postponement</h2>
      <p>
        If an event is postponed, your ticket will remain valid for the rescheduled date. If you cannot attend the new date, you may request a refund within 7 days of the postponement announcement.
      </p>

      <h2>5. How to Request a Refund</h2>
      <p>To request a refund:</p>
      <ul>
        <li>Contact our support team within 7 days of purchase</li>
        <li>Provide your order number and reason for the refund request</li>
        <li>Our team will review your request and respond within 3-5 business days</li>
      </ul>

      <h2>6. Processing Time</h2>
      <p>
        Approved refunds will be processed within 7-10 business days. The time for the refund to appear in your account may vary depending on your payment provider.
      </p>

      <h2>7. Contact Us</h2>
      <p>
        If you have any questions about our refund policy or need to request a refund, please contact our support team.
      </p>
    </>
  );
}

