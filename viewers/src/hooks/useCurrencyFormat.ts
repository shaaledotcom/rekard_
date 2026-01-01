"use client";

import { useMemo, useCallback } from "react";
import { useGeolocation } from "@/providers/GeolocationProvider";

export interface TicketPricing {
  currency: string;
  price: number;
  is_default: boolean;
}

// Default conversion rate INR to USD (approximate)
const INR_TO_USD_RATE = 0.012; // 1 INR = 0.012 USD
const USD_TO_INR_RATE = 83; // 1 USD = 83 INR

export function useCurrencyFormat() {
  const { geolocation, isIndia, userCurrency, isLoading: isGeoLoading } = useGeolocation();

  const getLocale = useCallback((): string => {
    if (typeof window === "undefined") return "en-US";
    
    // Use Indian locale for India users
    if (isIndia) {
      return "en-IN";
    }
    
    return navigator.language || "en-US";
  }, [isIndia]);

  const getCurrencyCode = useCallback((fallbackCurrency: string = "USD"): string => {
    // If user is in India, return INR
    if (isIndia) {
      return "INR";
    }
    
    // Otherwise return the provided fallback (usually USD)
    return fallbackCurrency;
  }, [isIndia]);

  const convertCurrency = useCallback((
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): number => {
    if (fromCurrency === toCurrency) {
      return amount;
    }

    // INR to USD conversion
    if (fromCurrency === "INR" && toCurrency === "USD") {
      return Math.round(amount * INR_TO_USD_RATE * 100) / 100;
    }

    // USD to INR conversion
    if (fromCurrency === "USD" && toCurrency === "INR") {
      return Math.round(amount * USD_TO_INR_RATE);
    }

    // For other currencies, return as-is (could add more conversions)
    return amount;
  }, []);

  const getPriceFromPricing = useCallback((
    basePrice: number,
    baseCurrency: string,
    pricing?: TicketPricing[],
    targetCurrency?: string
  ): { price: number; currency: string } => {
    // Determine the target currency based on user location
    const effectiveTargetCurrency = targetCurrency || getCurrencyCode("USD");

    // If pricing options are provided, try to find a matching currency
    if (pricing && pricing.length > 0) {
      // First, look for exact match with user's preferred currency
      const userCurrencyPricing = pricing.find(
        (p) => p.currency === effectiveTargetCurrency
      );
      if (userCurrencyPricing) {
        return {
          price: userCurrencyPricing.price,
          currency: userCurrencyPricing.currency,
        };
      }

      // If user is in India and INR pricing exists
      if (isIndia) {
        const inrPricing = pricing.find((p) => p.currency === "INR");
        if (inrPricing) {
          return { price: inrPricing.price, currency: "INR" };
        }
      }

      // Fall back to USD pricing if available
      const usdPricing = pricing.find((p) => p.currency === "USD");
      if (usdPricing) {
        // If user is in India but no INR pricing, convert USD to INR
        if (isIndia) {
          return {
            price: convertCurrency(usdPricing.price, "USD", "INR"),
            currency: "INR",
          };
        }
        return { price: usdPricing.price, currency: "USD" };
      }

      // Use first available pricing and convert if needed
      const firstPricing = pricing[0];
      if (firstPricing) {
        // If user is in India and the price is in different currency, try to convert to INR
        if (isIndia && firstPricing.currency !== "INR") {
          if (firstPricing.currency === "USD") {
            return {
              price: convertCurrency(firstPricing.price, "USD", "INR"),
              currency: "INR",
            };
          }
        }
        return { price: firstPricing.price, currency: firstPricing.currency };
      }
    }

    // No pricing options, use base price
    // If base price is in INR and user is not in India, convert to USD
    if (baseCurrency === "INR" && !isIndia) {
      return {
        price: convertCurrency(basePrice, "INR", "USD"),
        currency: "USD",
      };
    }

    // If base price is in USD and user is in India, convert to INR
    if (baseCurrency === "USD" && isIndia) {
      return {
        price: convertCurrency(basePrice, "USD", "INR"),
        currency: "INR",
      };
    }

    return { price: basePrice, currency: baseCurrency };
  }, [getCurrencyCode, isIndia, convertCurrency]);

  const formatPrice = useCallback((price: number, currency: string = "USD"): string => {
    const locale = getLocale();

    try {
      const formatted = new Intl.NumberFormat(locale, {
        style: "currency",
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(price);
      // Remove "US" prefix from dollar displays
      return formatted.replace(/US\$/g, "$");
    } catch (error) {
      // Fallback for unsupported currencies
      return `${currency} ${price.toFixed(2)}`;
    }
  }, [getLocale]);

  const formatPriceWithCurrency = useCallback((
    price: number,
    fallbackCurrency: string = "USD",
    pricing?: TicketPricing[],
    baseCurrency?: string
  ): string => {
    const { price: convertedPrice, currency: convertedCurrency } =
      getPriceFromPricing(price, baseCurrency || fallbackCurrency, pricing);
    
    return formatPrice(convertedPrice, convertedCurrency);
  }, [getPriceFromPricing, formatPrice]);

  // Get display currency and price for showing both if converted
  const getDisplayPrice = useCallback((
    basePrice: number,
    baseCurrency: string,
    pricing?: TicketPricing[]
  ): {
    displayPrice: number;
    displayCurrency: string;
    originalPrice?: number;
    originalCurrency?: string;
    isConverted: boolean;
  } => {
    const { price, currency } = getPriceFromPricing(basePrice, baseCurrency, pricing);
    
    const isConverted = currency !== baseCurrency;
    
    return {
      displayPrice: price,
      displayCurrency: currency,
      originalPrice: isConverted ? basePrice : undefined,
      originalCurrency: isConverted ? baseCurrency : undefined,
      isConverted,
    };
  }, [getPriceFromPricing]);

  return {
    formatPrice,
    formatPriceWithCurrency,
    getCurrencyCode,
    getPriceFromPricing,
    convertCurrency,
    getDisplayPrice,
    isIndia,
    userCurrency,
    isGeoLoading,
    geolocation,
  };
}
