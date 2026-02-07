"use client";

import React from "react";
import { Calendar, Clock, Hourglass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCurrencyFormat, TicketPricing } from "@/hooks/useCurrencyFormat";
import { useTimezoneFormat } from "@/hooks/useTimezoneFormat";
import { useEventInformation } from "@/hooks/useEventInformation";
import { PaymentSuccessPopup } from "./PaymentSuccessPopup";
import { CouponInput } from "./CouponInput";

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
  const { formatPrice } = useCurrencyFormat();
  const { formatDate } = useTimezoneFormat();

  const {
    showSuccessPopup,
    setShowSuccessPopup,
    isPurchased,
    discountAmount,
    finalPrice,
    convertedPrice,
    convertedCurrency,
    isEventExpired,
    latestEndDate,
    orderId,
    handleCouponApplied,
    handleCouponRemoved,
    buttonState,
    showCouponInput,
  } = useEventInformation(
    ticketId,
    ticketUrl,
    events,
    ticketPrice,
    ticketCurrency,
    ticketPricing,
    eventInfo.title || ""
  );

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

        {showCouponInput && ticketId && (
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
              {!isPurchased && (
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
                </div>
              )}
              {isEventExpired &&
                latestEndDate &&
                isPurchased && (
                  <div className="text-xs text-muted-foreground">
                    This event ended on{" "}
                    {formatDate(latestEndDate.toISOString(), {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                )}
              <Button
                className={`flex-1 h-10 sm:h-12 text-sm sm:text-base ${buttonState.variant === "default" && isPurchased
                    ? "bg-blue-500 text-white hover:bg-blue-600"
                    : ""
                  }`}
                size="lg"
                variant={buttonState.variant}
                onClick={buttonState.onClick}
                disabled={buttonState.disabled}
              >
                {buttonState.text}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <PaymentSuccessPopup
        isOpen={showSuccessPopup}
        onClose={() => setShowSuccessPopup(false)}
        eventTitle={eventInfo.title}
        orderId={orderId}
      />
    </>
  );
}

