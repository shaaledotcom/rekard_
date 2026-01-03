"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { VideoPageLayout } from "@/components/watch";
import { useWatchPage } from "@/hooks/useWatchPage";
import { Loader2, Lock } from "lucide-react";
import { MainLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";

export default function WatchPage() {
  const router = useRouter();
  const {
    ticketUrl,
    ticket,
    ticketId,
    purchaseStatus,
    isLoading,
    isAuthenticated,
    isTicketLoading,
  } = useWatchPage();

  const handleVideoEnded = () => {
    console.log("Video ended");
  };

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

  if (!isAuthenticated) {
    return null;
  }

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

