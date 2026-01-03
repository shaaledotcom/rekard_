"use client";

import { MainLayout } from "@/components/layout";
import { FeaturedCarousel, EventSection } from "@/components/dashboard";
import { useHomePage } from "@/hooks/useHomePage";

export default function HomePage() {
  const {
    myPurchases,
    liveEvents,
    upcomingEvents,
    onDemandEvents,
    isLoading,
    isError,
    isEmpty,
    isAuthenticated,
  } = useHomePage();

  if (isLoading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </MainLayout>
    );
  }

  if (isError) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <p className="text-lg text-destructive mb-4">
            Failed to load dashboard
          </p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-4">
        <FeaturedCarousel />

        {isAuthenticated && myPurchases.length > 0 && (
          <EventSection
            title="MY PURCHASES"
            events={myPurchases}
            showViewAll={myPurchases.length > 6}
            isPurchased
          />
        )}

        {liveEvents.length > 0 && (
          <EventSection
            title="LIVE NOW"
            titleColor="red"
            events={liveEvents}
            showViewAll={liveEvents.length > 6}
            isLive
          />
        )}

        {upcomingEvents.length > 0 && (
          <EventSection
            title="UPCOMING"
            events={upcomingEvents}
            showViewAll={upcomingEvents.length > 6}
          />
        )}

        {onDemandEvents.length > 0 && (
          <EventSection
            title="ON-DEMAND"
            events={onDemandEvents}
            showViewAll={onDemandEvents.length > 6}
          />
        )}

        {!isLoading && isEmpty && (
          <div className="flex flex-col items-center justify-center min-h-[300px] text-center py-12">
            <div className="text-6xl mb-4">🎬</div>
            <h2 className="text-xl font-semibold mb-2">No events available</h2>
            <p className="text-muted-foreground">
              Check back later for new events and content.
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
