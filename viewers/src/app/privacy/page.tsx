"use client";

import { MainLayout } from "@/components/layout";
import { useTenant } from "@/hooks/useTenant";
import { Skeleton } from "@/components/ui/skeleton";

export default function PrivacyPage() {
  const { config, isLoading } = useTenant();

  const privacyPolicy = config?.footer_policies?.privacy_policy;
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
          {privacyPolicy?.title || "Privacy Policy"}
        </h1>

        <div className="prose prose-sm dark:prose-invert max-w-none">
          {privacyPolicy?.content ? (
            <div dangerouslySetInnerHTML={{ __html: privacyPolicy.content }} />
          ) : (
            <DefaultPrivacyContent legalName={legalName} />
          )}
        </div>

        <p className="text-sm text-muted-foreground mt-8">
          Last updated: {new Date().toLocaleDateString()}
        </p>
      </article>
    </MainLayout>
  );
}

function DefaultPrivacyContent({ legalName }: { legalName: string }) {
  return (
    <>
      <p>
        At {legalName}, we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information.
      </p>

      <h2>1. Information We Collect</h2>
      <p>We collect information that you provide directly to us, such as:</p>
      <ul>
        <li>Name and email address when you create an account</li>
        <li>Payment information when you make a purchase</li>
        <li>Communications you send to us</li>
        <li>Information you provide when you participate in surveys or promotions</li>
      </ul>

      <h2>2. How We Use Your Information</h2>
      <p>We use the information we collect to:</p>
      <ul>
        <li>Provide, maintain, and improve our services</li>
        <li>Process transactions and send related information</li>
        <li>Send you technical notices, updates, and support messages</li>
        <li>Respond to your comments, questions, and requests</li>
        <li>Communicate with you about products, services, and events</li>
      </ul>

      <h2>3. Information Sharing</h2>
      <p>
        We do not sell, trade, or otherwise transfer your personal information to outside parties except as described in this policy. We may share your information with:
      </p>
      <ul>
        <li>Service providers who assist in our operations</li>
        <li>Business partners with your consent</li>
        <li>Legal authorities when required by law</li>
      </ul>

      <h2>4. Data Security</h2>
      <p>
        We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
      </p>

      <h2>5. Your Rights</h2>
      <p>You have the right to:</p>
      <ul>
        <li>Access your personal data</li>
        <li>Correct inaccurate data</li>
        <li>Request deletion of your data</li>
        <li>Object to processing of your data</li>
        <li>Request data portability</li>
      </ul>

      <h2>6. Cookies</h2>
      <p>
        We use cookies and similar tracking technologies to track activity on our service and hold certain information. You can instruct your browser to refuse all cookies or indicate when a cookie is being sent.
      </p>

      <h2>7. Contact Us</h2>
      <p>
        If you have any questions about this Privacy Policy, please contact us.
      </p>
    </>
  );
}

