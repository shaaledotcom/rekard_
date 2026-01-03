"use client";

import { MainLayout } from "@/components/layout";
import { useTenant } from "@/hooks/useTenant";
import { Skeleton } from "@/components/ui/skeleton";

export default function TermsPage() {
  const { config, isLoading } = useTenant();

  const termsPolicy = config?.footer_policies?.terms_of_service;
  const legalName = config?.legal_name || "Rekard";

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
          {termsPolicy?.title || "Terms of Service"}
        </h1>

        <div className="prose prose-sm dark:prose-invert max-w-none">
          {termsPolicy?.content ? (
            <div dangerouslySetInnerHTML={{ __html: termsPolicy.content }} />
          ) : (
            <DefaultTermsContent legalName={legalName} />
          )}
        </div>

        <p className="text-sm text-muted-foreground mt-8">
          Last updated: {new Date().toLocaleDateString()}
        </p>
      </article>
    </MainLayout>
  );
}

function DefaultTermsContent({ legalName }: { legalName: string }) {
  return (
    <>
      <p>
        Welcome to {legalName}. By accessing or using our platform, you agree to be bound by these Terms of Service.
      </p>

      <h2>1. Acceptance of Terms</h2>
      <p>
        By accessing and using this platform, you accept and agree to be bound by the terms and provision of this agreement.
      </p>

      <h2>2. Use of Service</h2>
      <p>
        You agree to use our services only for lawful purposes and in accordance with these Terms. You agree not to use our services:
      </p>
      <ul>
        <li>In any way that violates any applicable federal, state, local, or international law or regulation</li>
        <li>To transmit any unauthorized advertising or promotional material</li>
        <li>To impersonate or attempt to impersonate the Company, a Company employee, another user, or any other person or entity</li>
      </ul>

      <h2>3. Intellectual Property Rights</h2>
      <p>
        The Service and its original content, features, and functionality are and will remain the exclusive property of {legalName} and its licensors.
      </p>

      <h2>4. User Accounts</h2>
      <p>
        When you create an account with us, you must provide accurate, complete, and current information. Failure to do so constitutes a breach of the Terms.
      </p>

      <h2>5. Purchases and Payments</h2>
      <p>
        All purchases through our platform are subject to product availability. We reserve the right to refuse any order placed with us. Payment must be received prior to the acceptance of an order.
      </p>

      <h2>6. Limitation of Liability</h2>
      <p>
        In no event shall {legalName}, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages.
      </p>

      <h2>7. Changes to Terms</h2>
      <p>
        We reserve the right, at our sole discretion, to modify or replace these Terms at any time. Your continued use of the Service after any such changes constitutes your acceptance of the new Terms.
      </p>

      <h2>8. Contact Us</h2>
      <p>
        If you have any questions about these Terms, please contact us.
      </p>
    </>
  );
}

