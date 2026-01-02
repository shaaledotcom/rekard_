"use client";

import React, { useState } from "react";
import { Tag, X, Loader2, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useValidateCouponMutation } from "@/store/api";
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
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
    finalAmount: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const { formatPrice } = useCurrencyFormat();
  const [validateCoupon, { isLoading }] = useValidateCouponMutation();

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setError("Please enter a coupon code");
      return;
    }

    setError(null);

    try {
      const result = await validateCoupon({
        coupon_code: couponCode.trim().toUpperCase(),
        ticket_id: ticketId,
        order_amount: orderAmount,
      }).unwrap();

      if (result.is_valid && result.discount_amount !== undefined && result.final_amount !== undefined) {
        setAppliedCoupon({
          code: couponCode.trim().toUpperCase(),
          discountAmount: result.discount_amount,
          finalAmount: result.final_amount,
        });
        onCouponApplied(result.discount_amount, result.final_amount);
        setCouponCode("");
        setIsExpanded(false);
      } else {
        setError(result.message || "Invalid coupon code");
      }
    } catch (err: any) {
      console.error("Coupon validation error:", err);
      setError(err?.data?.message || "Failed to validate coupon. Please try again.");
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setError(null);
    onCouponRemoved();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleApplyCoupon();
    }
  };

  // If coupon is applied, show the applied state
  if (appliedCoupon) {
    return (
      <div className="mb-4">
        <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 border border-green-400 dark:border-green-800 rounded-lg">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-800 dark:text-green-500" />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-green-900 dark:text-green-400">
                {appliedCoupon.code}
              </span>
              <span className="text-xs text-green-800 dark:text-green-500">
                You save {formatPrice(appliedCoupon.discountAmount, currency)}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemoveCoupon}
            className="h-8 w-8 p-0 text-green-800 hover:text-green-900 hover:bg-green-100 dark:hover:bg-green-900/40"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Collapsed state - just show "Have a coupon code?" link
  if (!isExpanded) {
    return (
      <div className="mb-4">
        <button
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
        >
          <Tag className="h-4 w-4" />
          Have a coupon code?
        </button>
      </div>
    );
  }

  // Expanded state - show input field
  return (
    <div className="mb-4 space-y-2">
      <div className="flex items-center gap-2">
        <Tag className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Apply Coupon</span>
        <button
          onClick={() => {
            setIsExpanded(false);
            setError(null);
            setCouponCode("");
          }}
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
            onChange={(e) => {
              setCouponCode(e.target.value.toUpperCase());
              setError(null);
            }}
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

