"use client";

import { MainLayout } from "@/components/layout";
import { useTenant } from "@/hooks/useTenant";
import { Skeleton } from "@/components/ui/skeleton";

export default function AboutPage() {
  const { config, isLoading } = useTenant();

  const legalName = config?.legal_name || "Rekard Media Pvt Ltd";
  const isCustomDomain = config?.is_custom_domain;

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
        <h1 className="text-3xl font-bold mb-6">About Us</h1>

        <div className="prose prose-sm dark:prose-invert max-w-none">
          {isCustomDomain ? (
            <CustomDomainAbout legalName={legalName} />
          ) : (
            <DefaultAbout />
          )}
        </div>
      </article>
    </MainLayout>
  );
}

function CustomDomainAbout({ legalName }: { legalName: string }) {
  return (
    <>
      <p>
        Welcome to {legalName}&apos;s streaming platform.
      </p>
      <p>
        We bring you the best live events and on-demand content. Our platform is designed to provide you with a seamless viewing experience, whether you&apos;re watching live streams or catching up on past events.
      </p>
      <p>
        Thank you for choosing us for your entertainment needs.
      </p>
    </>
  );
}

function DefaultAbout() {
  return (
    <>
      <p>
        <strong>Rekard</strong> is a modern live streaming platform that empowers creators and event organizers to reach their audience worldwide.
      </p>

      <h2>Our Mission</h2>
      <p>
        We believe that everyone should have access to great content. Our mission is to make live streaming accessible, reliable, and engaging for both creators and viewers.
      </p>

      <h2>What We Offer</h2>
      <ul>
        <li>
          <strong>Live Streaming</strong> - High-quality live video streaming with low latency
        </li>
        <li>
          <strong>On-Demand Content</strong> - Access recorded events anytime, anywhere
        </li>
        <li>
          <strong>Secure Payments</strong> - Safe and secure ticket purchasing
        </li>
        <li>
          <strong>Multi-Platform</strong> - Watch on any device - mobile, tablet, or desktop
        </li>
      </ul>

      <h2>For Creators</h2>
      <p>
        Rekard provides a complete solution for content creators and event organizers. From ticketing to live streaming to on-demand content, we handle the technical details so you can focus on creating great content.
      </p>

      <h2>Contact</h2>
      <p>
        Have questions? We&apos;d love to hear from you. Visit our contact page or reach out to our support team.
      </p>
    </>
  );
}

