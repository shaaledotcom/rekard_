"use client";

import React, { useCallback } from "react";
import { Calendar, Clock, Hourglass, Heart, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCurrencyFormat, TicketPricing } from "@/hooks/useCurrencyFormat";
import { useTimezoneFormat } from "@/hooks/useTimezoneFormat";
import { useEventInformation } from "@/hooks/useEventInformation";
import { useGeolocation, isLocationBlocked } from "@/providers/GeolocationProvider";
import { PaymentSuccessPopup } from "./PaymentSuccessPopup";
import { CouponInput } from "./CouponInput";
import { AddToCalendarButton } from "./AddToCalendarButton";
import type { PublicEventDetails, GeoblockingRule } from "@/store/api/dashboardApi";

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
  fullEvents?: PublicEventDetails[]; // Full event details for calendar button
  isFundraiser?: boolean;
  geoblockingEnabled?: boolean;
  geoblockingCountries?: GeoblockingRule[];
}

export function EventInformation({
  eventInfo,
  ticketId,
  ticketUrl,
  events = [],
  ticketPrice = 0,
  ticketCurrency = "USD",
  ticketPricing,
  fullEvents = [],
  isFundraiser = false,
  geoblockingEnabled = false,
  geoblockingCountries,
}: EventInformationProps) {
  const { formatPrice } = useCurrencyFormat();
  const { formatDate } = useTimezoneFormat();
  const { geolocation } = useGeolocation();

  // Check if user's location is blocked
  const isGeoBlocked = isLocationBlocked(
    geoblockingEnabled,
    geoblockingCountries ?? null,
    geolocation
  );

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
    customPrice,
    setCustomPrice,
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
    eventInfo.title || "",
    isFundraiser
  );

  const handleCustomPriceChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (value === "") {
        setCustomPrice(null);
      } else {
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
          setCustomPrice(numValue);
        }
      }
    },
    [setCustomPrice]
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
          {fullEvents.length > 0 && fullEvents[0] && (
            <div className="pt-2">
              <AddToCalendarButton
                event={fullEvents[0]}
                ticketUrl={ticketUrl ? `/${ticketUrl}` : undefined}
              />
            </div>
          )}
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
            {/* Geoblocking notice */}
            {isGeoBlocked && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-destructive">Not available in your region</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    This ticket is not available for purchase in your current location.
                  </p>
                </div>
              </div>
            )}

            {/* Fundraiser variable price input */}
            {isFundraiser && !isPurchased && !isEventExpired && !isGeoBlocked && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Heart className="h-4 w-4 text-pink-500" />
                  <span>Support with your price</span>
                </div>
                <Input
                  type="number"
                  min={convertedPrice}
                  step="0.01"
                  value={customPrice ?? ""}
                  onChange={handleCustomPriceChange}
                  placeholder={`${convertedPrice}`}
                  className="h-12 text-lg font-semibold"
                />
                <p className="text-xs text-muted-foreground">
                  Minimum: {formatPrice(convertedPrice, convertedCurrency)}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between gap-2 sm:gap-4">
              {!isPurchased && !isFundraiser && (
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
                className={`flex-1 h-10 sm:h-12 text-sm sm:text-base
                  whitespace-nowrap overflow-hidden text-ellipsis
                  ${
                    isGeoBlocked
                      ? "bg-gray-100 text-gray-500 border-gray-300 cursor-not-allowed opacity-100"
                      : buttonState.variant === "default" && isPurchased
                      ? "bg-blue-500 text-white hover:bg-blue-600"
                      : ""
                  }`}
                size="lg"
                variant={isGeoBlocked ? "outline" : buttonState.variant}
                onClick={isGeoBlocked ? undefined : buttonState.onClick}
                disabled={isGeoBlocked || buttonState.disabled}
              >
                {isGeoBlocked ? "UNAVAILABLE" : buttonState.text}
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

