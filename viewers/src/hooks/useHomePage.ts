import { useMemo } from "react";
import { useGetDashboardQuery, useGetMyPurchasesQuery } from "@/store/api";
import { useAuth } from "@/hooks/useAuth";

/**
 * Custom hook for home page business logic
 * 
 * BUSINESS LOGIC OVERVIEW:
 * 
 * 1. DATA FETCHING:
 *    - Fetches dashboard data (live, upcoming, on-demand events)
 *    - Fetches user purchases only when authenticated
 *    - Uses pagination (12 items per section) for optimal performance
 * 
 * 2. PURCHASE FILTERING:
 *    - Filters purchased tickets from Live and Upcoming sections
 *    - Business Rule: Avoid duplication - purchased tickets appear in "My Purchases" section
 *    - On-demand events are NOT filtered - purchased VOD content should still be discoverable
 *    - Only applies filtering when user is authenticated and has purchases
 * 
 * 3. SECTION PRIORITY:
 *    - My Purchases: Shown first (when authenticated and has purchases)
 *    - Live Now: Real-time events with red indicator
 *    - Upcoming: Future scheduled events
 *    - On-Demand: VOD content available anytime
 * 
 * 4. LOADING & ERROR STATES:
 *    - Combines dashboard and purchases loading states
 *    - Shows error state if dashboard fails to load
 *    - Empty state when no events are available across all sections
 */
export function useHomePage() {
  const { isAuthenticated } = useAuth();

  // Fetch dashboard data with pagination
  const {
    data: dashboard,
    isLoading: isDashboardLoading,
    isError: isDashboardError,
  } = useGetDashboardQuery({
    live_page_size: 12,
    upcoming_page_size: 12,
    on_demand_page_size: 12,
  });

  // Fetch user purchases only when authenticated
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

  // Extract purchased ticket IDs for filtering
  const purchasedTicketIds = useMemo(() => {
    return new Set(myPurchases.map((p) => p.ticket_id || p.id));
  }, [myPurchases]);

  // Filter purchased tickets from Live section to avoid duplication
  const liveEvents = useMemo(() => {
    if (!isAuthenticated || purchasedTicketIds.size === 0) return rawLiveEvents;
    return rawLiveEvents.filter((event) => !purchasedTicketIds.has(event.id));
  }, [rawLiveEvents, purchasedTicketIds, isAuthenticated]);

  // Filter purchased tickets from Upcoming section to avoid duplication
  const upcomingEvents = useMemo(() => {
    if (!isAuthenticated || purchasedTicketIds.size === 0) return rawUpcomingEvents;
    return rawUpcomingEvents.filter((event) => !purchasedTicketIds.has(event.id));
  }, [rawUpcomingEvents, purchasedTicketIds, isAuthenticated]);

  // On-demand events are NOT filtered - purchased VOD content should remain discoverable
  const onDemandEvents = rawOnDemandEvents;

  // Combined loading state
  const isLoading = isDashboardLoading || (isAuthenticated && isMyPurchasesLoading);
  const isError = isDashboardError;

  // Check if all sections are empty
  const isEmpty =
    myPurchases.length === 0 &&
    liveEvents.length === 0 &&
    upcomingEvents.length === 0 &&
    onDemandEvents.length === 0;

  return {
    myPurchases,
    liveEvents,
    upcomingEvents,
    onDemandEvents,
    isLoading,
    isError,
    isEmpty,
    isAuthenticated,
  };
}

