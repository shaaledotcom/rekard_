"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Calendar, Clock, Hourglass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useCurrencyFormat, TicketPricing } from "@/hooks/useCurrencyFormat";
import { useTimezoneFormat } from "@/hooks/useTimezoneFormat";
import {
  useGetPurchaseStatusQuery,
  useCreateOrderMutation,
  useCompleteOrderMutation,
  useGetTicketPaymentConfigQuery,
} from "@/store/api";
import { useToast } from "@/hooks/use-toast";
import { PaymentSuccessPopup } from "./PaymentSuccessPopup";
import { CouponInput } from "./CouponInput";
import { useTenant } from "@/hooks/useTenant";

interface EventInfo {
  title: string;
  lastDate: string;
  date: string;
  time: string;
  duration: string;
  language: string;
  location: string;
  price: string;
  image: string;
}

interface EventData {
  id: number;
  title: string;
  end_datetime?: string;
}

interface EventInformationProps {
  eventInfo: EventInfo;
  ticketId?: string;
  ticketUrl?: string;
  events?: EventData[];
  ticketPrice?: number;
  ticketCurrency?: string;
  ticketPricing?: TicketPricing[];
}

export function EventInformation({
  eventInfo,
  ticketId,
  ticketUrl,
  events = [],
  ticketPrice = 0,
  ticketCurrency = "USD",
  ticketPricing,
}: EventInformationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const { config } = useTenant();
  const { formatPrice, getPriceFromPricing } = useCurrencyFormat();
  const { formatDate } = useTimezoneFormat();

  const [createOrder, { isLoading: isCreatingOrder }] =
    useCreateOrderMutation();
  const [completeOrder, { isLoading: isCompletingOrder }] =
    useCompleteOrderMutation();

  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [isPurchased, setIsPurchased] = useState(false);
  const [hasTriggeredPurchase, setHasTriggeredPurchase] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [finalPrice, setFinalPrice] = useState(0);
  const orderDataRef = useRef<{
    orderId?: number;
    paymentId?: string;
    userId?: string;
  }>({});

  const { price: convertedPrice, currency: convertedCurrency } =
    getPriceFromPricing(ticketPrice, ticketCurrency, ticketPricing);

  const {
    data: purchaseStatus,
    isLoading: isPurchaseStatusLoading,
  } = useGetPurchaseStatusQuery(parseInt(ticketId || "0"), {
    skip: !isAuthenticated || !ticketId,
  });

  // Get payment config for this ticket (Razorpay key from ticket owner's platform)
  const {
    data: paymentConfig,
    isLoading: isPaymentConfigLoading,
  } = useGetTicketPaymentConfigQuery(parseInt(ticketId || "0"), {
    skip: !ticketId,
  });

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

  const latestEndDate = useMemo(() => {
    if (!events || events.length === 0) return null;
    const endDates = events
      .map((event) => (event.end_datetime ? new Date(event.end_datetime) : null))
      .filter((date): date is Date => date !== null);
    if (endDates.length === 0) return null;
    return new Date(Math.max(...endDates.map((d) => d.getTime())));
  }, [events]);

  useEffect(() => {
    setFinalPrice(convertedPrice);
    setDiscountAmount(0);
  }, [convertedPrice]);

  useEffect(() => {
    if (purchaseStatus?.has_purchased) {
      setIsPurchased(true);
    }
  }, [purchaseStatus]);

  useEffect(() => {
    setHasTriggeredPurchase(false);
    setIsPurchased(false);
    setDiscountAmount(0);
    setFinalPrice(convertedPrice);
  }, [ticketId, convertedPrice]);

  const handleCouponApplied = (discount: number, finalAmount: number) => {
    setDiscountAmount(discount);
    setFinalPrice(finalAmount);
  };

  const handleCouponRemoved = () => {
    setDiscountAmount(0);
    setFinalPrice(convertedPrice);
  };

  const handleWatch = () => {
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
  };

  const loadRazorpayScript = (): Promise<boolean> => {
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
  };

  const handleBuyNow = useCallback(async () => {
    if (!ticketId || hasTriggeredPurchase) return;

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

    // Wait for payment config to load if still loading
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

    setHasTriggeredPurchase(true);

    try {
      const priceValue = finalPrice;
      const currency = convertedCurrency;

      // Create order for logged-in user
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

      // Get Razorpay key from ticket's payment config (based on ticket owner's platform)
      // This ensures we use the correct Razorpay keys for the ticket owner
      const razorpayKey = paymentConfig.razorpay_key_id;

      // Initialize Razorpay
      const options = {
        key: razorpayKey,
        amount: Math.round(priceValue * 100), // Razorpay expects amount in paise
        currency: currency,
        name: config?.legal_name || "Rekard",
        description: eventInfo.title,
        order_id: undefined, // We're not using Razorpay order, just their checkout
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
              description: "Payment received but order completion failed. Please contact support.",
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
    convertedCurrency,
    createOrder,
    completeOrder,
    paymentConfig,
    isPaymentConfigLoading,
    config,
    eventInfo.title,
    ticketUrl,
    router,
    toast,
  ]);

  const renderActionButton = () => {
    if (isEventExpired && (isPurchased || purchaseStatus?.has_purchased)) {
      return (
        <Button
          className="flex-1 h-10 sm:h-12 text-sm sm:text-base"
          size="lg"
          variant="outline"
          disabled={true}
        >
          EVENT ENDED
        </Button>
      );
    }

    if (isPurchased || purchaseStatus?.has_purchased) {
      return (
        <Button
          className="flex-1 h-10 sm:h-12 text-sm sm:text-base bg-blue-500 text-white hover:bg-blue-600"
          size="lg"
          variant="default"
          onClick={handleWatch}
          disabled={!ticketId || isEventExpired}
        >
          WATCH
        </Button>
      );
    }

    if (isEventExpired) {
      return (
        <Button
          className="flex-1 h-10 sm:h-12 text-sm sm:text-base"
          size="lg"
          variant="outline"
          disabled={true}
        >
          EVENT ENDED
        </Button>
      );
    }

    return (
      <Button
        className="flex-1 h-10 sm:h-12 text-sm sm:text-base"
        size="lg"
        variant="destructive"
        onClick={handleBuyNow}
        disabled={
          isCreatingOrder ||
          isCompletingOrder ||
          !ticketId ||
          hasTriggeredPurchase ||
          isPaymentConfigLoading ||
          !paymentConfig?.razorpay_key_id
        }
      >
        {isCreatingOrder || isCompletingOrder || hasTriggeredPurchase
          ? "PROCESSING..."
          : "BUY NOW"}
      </Button>
    );
  };

  return (
    <>
      <div className="bg-card rounded-lg border p-3 sm:p-6">
        <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            <span className="text-xs sm:text-sm">{eventInfo.date}</span>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            <span className="text-xs sm:text-sm">Starts at: {eventInfo.time}</span>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <Hourglass className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            <span className="text-xs sm:text-sm">Duration: {eventInfo.duration}</span>
          </div>
        </div>

        {/* Coupon Input - Only show if not purchased */}
        {ticketId && !(isPurchased || purchaseStatus?.has_purchased) && !isEventExpired && (
          <CouponInput
            ticketId={parseInt(ticketId)}
            orderAmount={convertedPrice}
            currency={convertedCurrency}
            onCouponApplied={handleCouponApplied}
            onCouponRemoved={handleCouponRemoved}
          />
        )}

        <div className="border-t pt-4 sm:pt-6">
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between gap-2 sm:gap-4">
              <div className="flex flex-col">
                <div className="font-bold text-primary text-sm sm:text-base">
                  {discountAmount > 0 ? (
                    <div className="flex items-center gap-2">
                      <span className="line-through text-muted-foreground text-xs">
                        {formatPrice(convertedPrice, convertedCurrency)}
                      </span>
                      <span>{formatPrice(finalPrice, convertedCurrency)}</span>
                    </div>
                  ) : (
                    formatPrice(finalPrice || convertedPrice, convertedCurrency)
                  )}
                </div>
                {discountAmount > 0 && (
                  <div className="text-xs text-green-600">
                    You save {formatPrice(discountAmount, convertedCurrency)}
                  </div>
                )}
                {isEventExpired &&
                  latestEndDate &&
                  (isPurchased || purchaseStatus?.has_purchased) && (
                    <div className="text-xs text-muted-foreground mt-1">
                      This event ended on{" "}
                      {formatDate(latestEndDate.toISOString(), {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                  )}
              </div>
              {renderActionButton()}
            </div>
          </div>
        </div>
      </div>

      <PaymentSuccessPopup
        isOpen={showSuccessPopup}
        onClose={() => setShowSuccessPopup(false)}
        eventTitle={eventInfo.title}
        orderId={orderDataRef.current.orderId}
      />
    </>
  );
}

