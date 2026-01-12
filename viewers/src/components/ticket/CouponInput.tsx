"use client";

import React from "react";
import { Tag, X, Loader2, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCouponInput } from "@/hooks/useCouponInput";
import { useCurrencyFormat } from "@/hooks/useCurrencyFormat";

interface CouponInputProps {
  ticketId: number;
  orderAmount: number;
  currency?: string;
  onCouponApplied: (discountAmount: number, finalAmount: number) => void;
  onCouponRemoved: () => void;
}

export function CouponInput({
  ticketId,
  orderAmount,
  currency = "USD",
  onCouponApplied,
  onCouponRemoved,
}: CouponInputProps) {
  const { formatPrice } = useCurrencyFormat();
  const {
    couponCode,
    appliedCoupon,
    error,
    isExpanded,
    isLoading,
    handleApplyCoupon,
    handleRemoveCoupon,
    handleKeyPress,
    updateCouponCode,
    expandInput,
    collapseInput,
  } = useCouponInput(ticketId, orderAmount, onCouponApplied, onCouponRemoved);

  if (appliedCoupon) {
    return (
      <div className="mb-4">
        <div className="flex items-center justify-between p-3  border border-green-400 dark:border-green-800 rounded-lg">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4" />
            <div className="flex flex-col">
              <span className="text-sm font-medium">
                {appliedCoupon.code}
              </span>
              <span className="text-xs">
                You save {formatPrice(appliedCoupon.discountAmount, currency)}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemoveCoupon}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  if (!isExpanded) {
    return (
      <div className="mb-4">
        <button
          onClick={expandInput}
          className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
        >
          <Tag className="h-4 w-4" />
          Have a coupon code?
        </button>
      </div>
    );
  }

  return (
    <div className="mb-4 space-y-2">
      <div className="flex items-center gap-2">
        <Tag className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Apply Coupon</span>
        <button
          onClick={collapseInput}
          className="ml-auto text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Enter coupon code"
            value={couponCode}
            onChange={(e) => updateCouponCode(e.target.value)}
            onKeyPress={handleKeyPress}
            className={`uppercase ${error ? "border-red-500 focus-visible:ring-red-500" : ""}`}
            disabled={isLoading}
            autoFocus
          />
        </div>
        <Button
          onClick={handleApplyCoupon}
          disabled={isLoading || !couponCode.trim()}
          size="default"
          variant="outline"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Apply"
          )}
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

export default CouponInput;

