"use client";

import { useMemo } from "react";
import { useGetUserSubscriptionQuery, useGetUserWalletQuery } from "@/store/api";

export type PlanTier = "free" | "pro" | "premium";

export interface PlanStatus {
  // Current plan info
  planTier: PlanTier;
  planName: string | null;
  isActive: boolean;
  
  // Feature access
  hasProFeatures: boolean;
  hasPremiumFeatures: boolean;
  
  // Publishing requirements
  hasActivePlan: boolean;
  hasTickets: boolean;
  canPublish: boolean;
  ticketBalance: number;
  
  // Loading states
  isLoading: boolean;
  
  // Raw data
  subscription: ReturnType<typeof useGetUserSubscriptionQuery>["data"];
  wallet: ReturnType<typeof useGetUserWalletQuery>["data"];
}

/**
 * Hook for checking user's plan status and feature access
 * 
 * Plan Hierarchy:
 * - Free: Basic features, cannot publish
 * - Pro: Custom domain, payment gateway, payment receiver settings
 * - Premium: All Pro features + additional enterprise features
 * 
 * Publishing Requirements:
 * - Must have an active plan (Pro or Premium)
 * - Must have tickets in wallet
 */
export function usePlan(): PlanStatus {
  const { 
    data: subscriptionData, 
    isLoading: isLoadingSubscription 
  } = useGetUserSubscriptionQuery();
  
  const { 
    data: walletData, 
    isLoading: isLoadingWallet 
  } = useGetUserWalletQuery();

  const status = useMemo(() => {
    const subscription = subscriptionData?.data;
    const wallet = walletData?.data;
    
    const isActive = subscription?.status === "active";
    const planName = subscription?.plan?.name?.toLowerCase() || null;
    
    // Determine plan tier
    let planTier: PlanTier = "free";
    if (isActive && planName) {
      if (planName === "premium") {
        planTier = "premium";
      } else if (planName === "pro") {
        planTier = "pro";
      }
    }
    
    const hasProFeatures = planTier === "pro" || planTier === "premium";
    const hasPremiumFeatures = planTier === "premium";
    
    const ticketBalance = wallet?.ticket_balance || 0;
    const hasTickets = ticketBalance > 0;
    
    // Publishing requires both active plan AND tickets
    const canPublish = isActive && hasTickets;
    
    return {
      planTier,
      planName,
      isActive,
      hasProFeatures,
      hasPremiumFeatures,
      hasActivePlan: isActive,
      hasTickets,
      canPublish,
      ticketBalance,
      isLoading: isLoadingSubscription || isLoadingWallet,
      subscription: subscriptionData,
      wallet: walletData,
    };
  }, [subscriptionData, walletData, isLoadingSubscription, isLoadingWallet]);

  return status;
}

/**
 * Feature flags for plan-based features
 */
export const PLAN_FEATURES = {
  // Pro Plan Features
  customDomain: { minPlan: "pro" as PlanTier, label: "Custom Domain" },
  paymentGateway: { minPlan: "pro" as PlanTier, label: "Payment Gateway" },
  paymentReceiver: { minPlan: "pro" as PlanTier, label: "Direct Payments" },
  smsGateway: { minPlan: "pro" as PlanTier, label: "SMS Gateway" },
  emailGateway: { minPlan: "pro" as PlanTier, label: "Email Gateway" },
  
  // Premium Plan Features
  whiteLabel: { minPlan: "premium" as PlanTier, label: "White Label" },
  prioritySupport: { minPlan: "premium" as PlanTier, label: "Priority Support" },
  analytics: { minPlan: "premium" as PlanTier, label: "Advanced Analytics" },
} as const;

/**
 * Check if a plan tier has access to a feature
 */
export function hasFeatureAccess(currentPlan: PlanTier, requiredPlan: PlanTier): boolean {
  const planHierarchy: Record<PlanTier, number> = {
    free: 0,
    pro: 1,
    premium: 2,
  };
  
  return planHierarchy[currentPlan] >= planHierarchy[requiredPlan];
}

