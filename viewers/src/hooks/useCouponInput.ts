import { useState } from "react";
import { useValidateCouponMutation } from "@/store/api";

export interface AppliedCoupon {
  code: string;
  discountAmount: number;
  finalAmount: number;
}

/**
 * Custom hook for CouponInput business logic
 * 
 * BUSINESS LOGIC OVERVIEW:
 * 
 * 1. COUPON VALIDATION:
 *    - Validates coupon code against ticket and order amount via API
 *    - Normalizes coupon code to uppercase for consistency
 *    - Validates discount_amount and final_amount are present before applying
 *    - Handles API errors with user-friendly messages
 * 
 * 2. STATE MANAGEMENT:
 *    - Three UI states: collapsed, expanded (input), applied (success)
 *    - Tracks coupon code input, applied coupon data, and error messages
 *    - Clears input and collapses after successful application
 * 
 * 3. COUPON APPLICATION:
 *    - Applies discount and calculates final amount
 *    - Notifies parent component via callback with discount and final amounts
 *    - Stores applied coupon data for display and removal
 * 
 * 4. COUPON REMOVAL:
 *    - Clears applied coupon state
 *    - Notifies parent component to recalculate order total
 *    - Resets error state
 * 
 * 5. USER INTERACTION:
 *    - Enter key submits coupon validation
 *    - Auto-uppercase input for better UX
 *    - Clears errors on input change
 */
export function useCouponInput(
  ticketId: number,
  orderAmount: number,
  onCouponApplied: (discountAmount: number, finalAmount: number) => void,
  onCouponRemoved: () => void
) {
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const [validateCoupon, { isLoading }] = useValidateCouponMutation();

  // Apply coupon code
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

      if (
        result.is_valid &&
        result.discount_amount !== undefined &&
        result.final_amount !== undefined
      ) {
        const applied: AppliedCoupon = {
          code: couponCode.trim().toUpperCase(),
          discountAmount: result.discount_amount,
          finalAmount: result.final_amount,
        };
        setAppliedCoupon(applied);
        onCouponApplied(result.discount_amount, result.final_amount);
        setCouponCode("");
        setIsExpanded(false);
      } else {
        setError(result.message || "Invalid coupon code");
      }
    } catch (err: any) {
      console.error("Coupon validation error:", err);
      setError(
        err?.data?.message || "Failed to validate coupon. Please try again."
      );
    }
  };

  // Remove applied coupon
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setError(null);
    onCouponRemoved();
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleApplyCoupon();
    }
  };

  // Update coupon code with auto-uppercase and error clearing
  const updateCouponCode = (value: string) => {
    setCouponCode(value.toUpperCase());
    setError(null);
  };

  // Expand input section
  const expandInput = () => {
    setIsExpanded(true);
  };

  // Collapse input section and reset
  const collapseInput = () => {
    setIsExpanded(false);
    setError(null);
    setCouponCode("");
  };

  return {
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
  };
}

