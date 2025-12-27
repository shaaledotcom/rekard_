"use client";

import { useMemo } from "react";
import { MainLayout } from "@/components/layout";
import { FeaturedCarousel, EventSection } from "@/components/dashboard";
import { useGetDashboardQuery, useGetMyPurchasesQuery } from "@/store/api";
import { useAuth } from "@/hooks/useAuth";

export default function HomePage() {
  const { user, isAuthenticated } = useAuth();

  const {
    data: dashboard,
    isLoading: isDashboardLoading,
    isError: isDashboardError,
  } = useGetDashboardQuery({
    live_page_size: 12,
    upcoming_page_size: 12,
    on_demand_page_size: 12,
  });

  const {
    data: myPurchasesData,
    isLoading: isMyPurchasesLoading,
  } = useGetMyPurchasesQuery(
    { page_size: 12 },
    { skip: !isAuthenticated }
  );

  const myPurchases = myPurchasesData?.data || [];
  const rawLiveEvents = dashboard?.live?.data || [];
  const rawUpcomingEvents = dashboard?.upcoming?.data || [];
  const rawOnDemandEvents = dashboard?.on_demand?.data || [];

  // Get IDs of purchased tickets for filtering
  const purchasedTicketIds = useMemo(() => {
    return new Set(myPurchases.map((p) => p.ticket_id || p.id));
  }, [myPurchases]);

  // Filter out purchased tickets from live and upcoming sections
  // Business logic: If user has purchased a ticket, don't show it in Live/Upcoming
  const liveEvents = useMemo(() => {
    if (!isAuthenticated || purchasedTicketIds.size === 0) return rawLiveEvents;
    return rawLiveEvents.filter((event) => !purchasedTicketIds.has(event.id));
  }, [rawLiveEvents, purchasedTicketIds, isAuthenticated]);

  const upcomingEvents = useMemo(() => {
    if (!isAuthenticated || purchasedTicketIds.size === 0) return rawUpcomingEvents;
    return rawUpcomingEvents.filter((event) => !purchasedTicketIds.has(event.id));
  }, [rawUpcomingEvents, purchasedTicketIds, isAuthenticated]);

  // On-demand doesn't need filtering - purchased content should still show
  const onDemandEvents = rawOnDemandEvents;

  const isLoading = isDashboardLoading || (isAuthenticated && isMyPurchasesLoading);
  const isError = isDashboardError;

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
        {/* Featured Carousel */}
        <FeaturedCarousel />

        {/* My Purchases Section - Only show when logged in and has purchases */}
        {isAuthenticated && myPurchases.length > 0 && (
          <EventSection
            title="MY PURCHASES"
            events={myPurchases}
            showViewAll={myPurchases.length > 6}
            isPurchased
          />
        )}

        {/* Live Now Section */}
        {liveEvents.length > 0 && (
          <EventSection
            title="LIVE NOW"
            titleColor="red"
            events={liveEvents}
            showViewAll={liveEvents.length > 6}
            isLive
          />
        )}

        {/* Upcoming Section */}
        {upcomingEvents.length > 0 && (
          <EventSection
            title="UPCOMING"
            events={upcomingEvents}
            showViewAll={upcomingEvents.length > 6}
          />
        )}

        {/* On-Demand Section */}
        {onDemandEvents.length > 0 && (
          <EventSection
            title="ON-DEMAND"
            events={onDemandEvents}
            showViewAll={onDemandEvents.length > 6}
          />
        )}

        {/* Empty state */}
        {!isLoading &&
          myPurchases.length === 0 &&
          liveEvents.length === 0 &&
          upcomingEvents.length === 0 &&
          onDemandEvents.length === 0 && (
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
