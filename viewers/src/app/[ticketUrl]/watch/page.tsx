"use client";

import React, { useEffect } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import { VideoPageLayout } from "@/components/watch";
import { useAuth } from "@/hooks/useAuth";
import { useGetTicketByUrlQuery, useGetPurchaseStatusQuery } from "@/store/api";
import { Loader2, Lock } from "lucide-react";
import { MainLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";

export default function WatchPage() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const ticketUrl = params.ticketUrl as string;

  const urlWithSlash = ticketUrl?.startsWith("/") ? ticketUrl : `/${ticketUrl}`;

  const { data: ticket, isLoading: isTicketLoading } = useGetTicketByUrlQuery(
    urlWithSlash,
    { skip: !ticketUrl }
  );

  const ticketId = ticket?.id;

  const { data: purchaseStatus, isLoading: isPurchaseStatusLoading } =
    useGetPurchaseStatusQuery(ticketId || 0, {
      skip: !ticketId || !isAuthenticated,
    });

  const handleVideoEnded = () => {
    console.log("Video ended");
  };

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      const returnUrl = pathname ? encodeURIComponent(pathname) : undefined;
      const authUrl = returnUrl ? `/auth?returnUrl=${returnUrl}` : "/auth";
      router.push(authUrl);
    }
  }, [isAuthLoading, isAuthenticated, router, pathname]);

  // Redirect to ticket page if not purchased (but not if archived - archived check happens in render)
  useEffect(() => {
    if (
      !isAuthLoading &&
      isAuthenticated &&
      !isPurchaseStatusLoading &&
      purchaseStatus &&
      !purchaseStatus.has_purchased &&
      ticketId
    ) {
      router.push(`/${ticketUrl}`);
    }
  }, [
    isAuthLoading,
    isAuthenticated,
    isPurchaseStatusLoading,
    purchaseStatus,
    ticketId,
    ticketUrl,
    router,
  ]);

  // Loading state - also wait for ticket data before showing "not found"
  const isLoading = isAuthLoading || isTicketLoading || (isAuthenticated && ticketId && isPurchaseStatusLoading);
  
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

  // Not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Ticket not found - only show after ticket query has completed
  if (!isTicketLoading && !ticketId) {
    return (
      <MainLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground">Ticket not found</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push("/")}
            >
              Go Home
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Not purchased
  // Note: Archive checking is done per-event in VideoPageLayout, not per-ticket
  if (purchaseStatus && !purchaseStatus.has_purchased) {
    return (
      <MainLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <Lock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
            <p className="text-muted-foreground mb-4">
              You need to purchase this ticket to watch the content.
            </p>
            <Button onClick={() => router.push(`/${ticketUrl}`)}>
              View Ticket Details
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <VideoPageLayout
      videoSrc=""
      thumbnailSrc=""
      onVideoEnded={handleVideoEnded}
      ticketId={ticketId!.toString()}
    />
  );
}

