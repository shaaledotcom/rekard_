import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useCurrencyFormat, TicketPricing } from "@/hooks/useCurrencyFormat";
import {
  useGetPurchaseStatusQuery,
  useCreateOrderMutation,
  useCompleteOrderMutation,
  useGetTicketPaymentConfigQuery,
} from "@/store/api";
import { useToast } from "@/hooks/use-toast";
import { useTenant } from "@/hooks/useTenant";

interface EventData {
  id: number;
  title: string;
  end_datetime?: string;
}

/**
 * Custom hook for EventInformation business logic
 * 
 * BUSINESS LOGIC OVERVIEW:
 * 
 * 1. PURCHASE STATUS & STATE:
 *    - Checks if user has already purchased the ticket
 *    - Syncs purchase status from API with local state
 *    - Resets state when ticket changes
 * 
 * 2. PRICE CALCULATION:
 *    - Converts price based on tenant currency and pricing structure
 *    - Applies coupon discounts to calculate final price
 *    - Tracks discount amount for display
 * 
 * 3. EVENT EXPIRATION:
 *    - Checks if any event has ended (end_datetime < now)
 *    - Calculates latest end date across all events
 *    - Disables purchase/watch actions for expired events
 * 
 * 4. PAYMENT PROCESSING:
 *    - Creates order before payment
 *    - Loads Razorpay payment gateway dynamically
 *    - Uses ticket owner's Razorpay key (from payment config)
 *    - Completes order after successful payment
 *    - Navigates to watch page on success
 * 
 * 5. COUPON HANDLING:
 *    - Applies discount to final price
 *    - Resets price when coupon is removed
 *    - Only shows coupon input for unpurchased, non-expired tickets
 * 
 * 6. ACTION BUTTON STATES:
 *    - "BUY NOW": For unpurchased, non-expired tickets
 *    - "WATCH": For purchased tickets (if not expired)
 *    - "EVENT ENDED": For expired events
 *    - Disabled states during payment processing
 */
export function useEventInformation(
  ticketId: string | undefined,
  ticketUrl: string | undefined,
  events: EventData[],
  ticketPrice: number,
  ticketCurrency: string,
  ticketPricing: TicketPricing[] | undefined,
  eventTitle: string,
  isFundraiser: boolean = false
) {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const { config } = useTenant();
  const { formatPrice, getPriceFromPricing } = useCurrencyFormat();

  const [createOrder, { isLoading: isCreatingOrder }] =
    useCreateOrderMutation();
  const [completeOrder, { isLoading: isCompletingOrder }] =
    useCompleteOrderMutation();

  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [isPurchased, setIsPurchased] = useState(false);
  const [hasTriggeredPurchase, setHasTriggeredPurchase] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [finalPrice, setFinalPrice] = useState(0);
  const [customPrice, setCustomPrice] = useState<number | null>(null);
  const orderDataRef = useRef<{
    orderId?: number;
    paymentId?: string;
    userId?: string;
  }>({});

  // Convert price based on tenant currency
  const { price: convertedPrice, currency: convertedCurrency } =
    getPriceFromPricing(ticketPrice, ticketCurrency, ticketPricing);

  // Check purchase status
  const {
    data: purchaseStatus,
    isLoading: isPurchaseStatusLoading,
  } = useGetPurchaseStatusQuery(parseInt(ticketId || "0"), {
    skip: !isAuthenticated || !ticketId,
  });

  // Get payment config (Razorpay key from ticket owner's platform)
  const {
    data: paymentConfig,
    isLoading: isPaymentConfigLoading,
  } = useGetTicketPaymentConfigQuery(parseInt(ticketId || "0"), {
    skip: !ticketId,
  });

  // Check if event has expired
  const isEventExpired = useMemo(() => {
    if (!events || events.length === 0) return false;
    const now = new Date();
    return events.some((event) => {
      if (event.end_datetime) {
        const endDate = new Date(event.end_datetime);
        return endDate < now;
      }
      return false;
    });
  }, [events]);

  // Get latest end date across all events
  const latestEndDate = useMemo(() => {
    if (!events || events.length === 0) return null;
    const endDates = events
      .map((event) =>
        event.end_datetime ? new Date(event.end_datetime) : null
      )
      .filter((date): date is Date => date !== null);
    if (endDates.length === 0) return null;
    return new Date(Math.max(...endDates.map((d) => d.getTime())));
  }, [events]);

  // Initialize final price when converted price changes
  useEffect(() => {
    setFinalPrice(convertedPrice);
    setDiscountAmount(0);
  }, [convertedPrice]);

  // Sync purchase status from API
  useEffect(() => {
    if (purchaseStatus?.has_purchased) {
      setIsPurchased(true);
    }
  }, [purchaseStatus]);

  // Reset state when ticket changes
  useEffect(() => {
    setHasTriggeredPurchase(false);
    setIsPurchased(false);
    setDiscountAmount(0);
    setFinalPrice(convertedPrice);
  }, [ticketId, convertedPrice]);

  // Handle coupon application
  const handleCouponApplied = useCallback(
    (discount: number, finalAmount: number) => {
      setDiscountAmount(discount);
      setFinalPrice(finalAmount);
    },
    []
  );

  // Handle coupon removal
  const handleCouponRemoved = useCallback(() => {
    setDiscountAmount(0);
    setFinalPrice(convertedPrice);
  }, [convertedPrice]);

  // Navigate to watch page
  const handleWatch = useCallback(() => {
    if (isPurchased || purchaseStatus?.has_purchased) {
      const currentTitle = ticketUrl || ticketId;
      if (currentTitle) {
        router.push(`/${currentTitle}/watch`);
      } else {
        toast({
          title: "Error",
          description: "Unable to navigate to watch page",
          variant: "destructive",
        });
      }
    }
  }, [isPurchased, purchaseStatus, ticketUrl, ticketId, router, toast]);

  // Load Razorpay script dynamically
  const loadRazorpayScript = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window !== "undefined" && (window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }, []);

  // Handle buy now - payment flow
  const handleBuyNow = useCallback(async () => {
    if (!ticketId || hasTriggeredPurchase) return;

    // Require authentication
    if (!isAuthenticated || !user?.id) {
      toast({
        title: "Login required",
        description: "Please login to purchase tickets",
      });
      const returnUrl = pathname ? encodeURIComponent(pathname) : undefined;
      const authUrl = returnUrl ? `/auth?returnUrl=${returnUrl}` : "/auth";
      router.push(authUrl);
      return;
    }

    // Wait for payment config
    if (isPaymentConfigLoading) {
      toast({
        title: "Loading",
        description: "Please wait while we load payment configuration...",
      });
      return;
    }

    if (!paymentConfig?.razorpay_key_id) {
      toast({
        title: "Error",
        description: "Payment gateway not configured. Please contact support.",
        variant: "destructive",
      });
      return;
    }

    // Validate fundraiser custom price
    if (isFundraiser) {
      const effectiveCustomPrice = customPrice ?? convertedPrice;
      if (effectiveCustomPrice < convertedPrice) {
        toast({
          title: "Invalid amount",
          description: `Minimum amount is ${formatPrice(convertedPrice, convertedCurrency)}`,
          variant: "destructive",
        });
        return;
      }
    }

    setHasTriggeredPurchase(true);

    try {
      // For fundraiser tickets, use the custom price; otherwise use final price
      const priceValue = isFundraiser && customPrice !== null ? customPrice : finalPrice;
      const currency = convertedCurrency;

      // Create order
      const orderData = await createOrder({
        ticket_id: parseInt(ticketId),
        quantity: 1,
        unit_price: priceValue,
        currency: currency,
      }).unwrap();

      if (!orderData?.order_id) {
        throw new Error("Invalid response from server");
      }

      orderDataRef.current = {
        orderId: orderData.order_id,
        userId: user.id,
      };

      // Load Razorpay
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        throw new Error("Failed to load payment gateway");
      }

      // Use ticket owner's Razorpay key
      const razorpayKey = paymentConfig.razorpay_key_id;

      // Initialize Razorpay checkout
      const options = {
        key: razorpayKey,
        amount: Math.round(priceValue * 100), // Convert to paise
        currency: currency,
        name: config?.legal_name || "Rekard",
        description: eventTitle,
        order_id: undefined,
        handler: async (response: any) => {
          try {
            // Complete order after payment
            await completeOrder({
              order_id: orderDataRef.current.orderId!,
              payment_id: response.razorpay_payment_id,
              user_id: orderDataRef.current.userId,
            }).unwrap();

            setIsPurchased(true);

            // Navigate to watch page
            const currentTitle = ticketUrl || ticketId;
            if (currentTitle) {
              router.push(`/${currentTitle}/watch`);
            } else {
              setShowSuccessPopup(true);
            }
          } catch (error) {
            console.error("Failed to complete order:", error);
            toast({
              title: "Error",
              description:
                "Payment received but order completion failed. Please contact support.",
              variant: "destructive",
            });
          }
        },
        prefill: {
          name: user.email?.split("@")[0] || "",
          email: user.email || "",
        },
        theme: {
          color: "#3399cc",
        },
        modal: {
          ondismiss: () => {
            setHasTriggeredPurchase(false);
          },
        },
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error("Failed to initiate payment:", error);
      toast({
        title: "Error",
        description: "Failed to initiate payment. Please try again.",
        variant: "destructive",
      });
      setHasTriggeredPurchase(false);
    }
  }, [
    ticketId,
    hasTriggeredPurchase,
    isAuthenticated,
    user,
    finalPrice,
    convertedPrice,
    convertedCurrency,
    customPrice,
    isFundraiser,
    createOrder,
    completeOrder,
    paymentConfig,
    isPaymentConfigLoading,
    config,
    eventTitle,
    ticketUrl,
    router,
    toast,
    pathname,
    loadRazorpayScript,
    formatPrice,
  ]);

  // Determine button state and text
  const buttonState = useMemo(() => {
    if (isEventExpired && (isPurchased || purchaseStatus?.has_purchased)) {
      return { text: "EVENT ENDED", variant: "outline" as const, disabled: true };
    }

    if (isPurchased || purchaseStatus?.has_purchased) {
      return {
        text: "WATCH",
        variant: "default" as const,
        disabled: !ticketId || isEventExpired,
        onClick: handleWatch,
      };
    }

    if (isEventExpired) {
      return { text: "EVENT ENDED", variant: "outline" as const, disabled: true };
    }

    return {
      text:
        isCreatingOrder || isCompletingOrder || hasTriggeredPurchase
          ? "PROCESSING..."
          : "BUY NOW",
      variant: "destructive" as const,
      disabled:
        isCreatingOrder ||
        isCompletingOrder ||
        !ticketId ||
        hasTriggeredPurchase ||
        isPaymentConfigLoading ||
        !paymentConfig?.razorpay_key_id,
      onClick: handleBuyNow,
    };
  }, [
    isEventExpired,
    isPurchased,
    purchaseStatus,
    ticketId,
    isCreatingOrder,
    isCompletingOrder,
    hasTriggeredPurchase,
    isPaymentConfigLoading,
    paymentConfig,
    handleWatch,
    handleBuyNow,
  ]);

  const hasPurchased = isPurchased || purchaseStatus?.has_purchased;
  const showCouponInput =
    ticketId && !hasPurchased && !isEventExpired;

  return {
    // State
    showSuccessPopup,
    setShowSuccessPopup,
    isPurchased: hasPurchased,
    discountAmount,
    finalPrice,
    convertedPrice,
    convertedCurrency,
    isEventExpired,
    latestEndDate,
    orderId: orderDataRef.current.orderId,
    customPrice,
    setCustomPrice,

    // Loading states
    isPurchaseStatusLoading,
    isPaymentConfigLoading,
    isCreatingOrder,
    isCompletingOrder,

    // Handlers
    handleCouponApplied,
    handleCouponRemoved,
    buttonState,
    showCouponInput,
  };
}

