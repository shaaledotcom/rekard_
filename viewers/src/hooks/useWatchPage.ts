import { useEffect } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useGetTicketByUrlQuery, useGetPurchaseStatusQuery } from "@/store/api";

/**
 * Custom hook for watch page business logic
 * 
 * BUSINESS LOGIC OVERVIEW:
 * 
 * 1. AUTHENTICATION & ACCESS CONTROL:
 *    - Requires authenticated user to access watch page
 *    - Redirects unauthenticated users to auth page with return URL for seamless return
 *    - Purchase status is only checked after authentication to avoid unnecessary API calls
 * 
 * 2. PURCHASE VERIFICATION:
 *    - Verifies user has purchased the ticket before allowing access
 *    - Redirects non-purchased users back to ticket detail page
 *    - Note: Archive/expiry checks are handled per-event in VideoPageLayout, not here
 * 
 * 3. LOADING STATE MANAGEMENT:
 *    - Combines auth, ticket, and purchase status loading states
 *    - Ensures all required data is loaded before rendering access controls
 *    - Prevents showing "not found" errors while ticket data is still loading
 * 
 * 4. ERROR HANDLING:
 *    - Handles missing ticket URL gracefully
 *    - Shows appropriate error states for ticket not found vs access denied
 */
export function useWatchPage() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const ticketUrl = params.ticketUrl as string;

  // Normalize URL for backend API consistency
  const urlWithSlash = ticketUrl?.startsWith("/") ? ticketUrl : `/${ticketUrl}`;

  // Fetch ticket data (skipped if no ticketUrl)
  const { data: ticket, isLoading: isTicketLoading } = useGetTicketByUrlQuery(
    urlWithSlash,
    { skip: !ticketUrl }
  );

  const ticketId = ticket?.id;

  // Fetch purchase status only if authenticated and ticketId exists
  const { data: purchaseStatus, isLoading: isPurchaseStatusLoading } =
    useGetPurchaseStatusQuery(ticketId || 0, {
      skip: !ticketId || !isAuthenticated,
    });

  // Redirect unauthenticated users to auth page with return URL
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      const returnUrl = pathname ? encodeURIComponent(pathname) : undefined;
      const authUrl = returnUrl ? `/auth?returnUrl=${returnUrl}` : "/auth";
      router.push(authUrl);
    }
  }, [isAuthLoading, isAuthenticated, router, pathname]);

  // Redirect non-purchased users to ticket detail page
  // Archive checks happen per-event in VideoPageLayout, not here
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

  // Combined loading state: wait for auth, ticket, and purchase status
  const isLoading =
    isAuthLoading ||
    isTicketLoading ||
    (isAuthenticated && ticketId && isPurchaseStatusLoading);

  return {
    ticketUrl,
    ticket,
    ticketId,
    purchaseStatus,
    isLoading,
    isAuthenticated,
    isTicketLoading,
  };
}

