"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useGetBillingPlansQuery,
  BillingPlan,
  PlanFeature,
  UserSubscription,
} from "@/store/api";
import { useRazorpayPayment } from "@/hooks/useRazorpayPayment";
import { useAuth } from "@/hooks/useAuth";
import {
  Ticket,
  CreditCard,
  Video,
  Globe,
  Mail,
  ShieldCheck,
  Sparkles,
  Phone,
  Crown,
  Loader2,
  type LucideIcon,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  ticket: Ticket,
  "credit-card": CreditCard,
  video: Video,
  globe: Globe,
  mail: Mail,
  "shield-check": ShieldCheck,
  sparkles: Sparkles,
  phone: Phone,
  crown: Crown,
};

const getIcon = (iconName: string): LucideIcon => {
  return iconMap[iconName] || Ticket;
};

interface BillingPlansProps {
  subscription?: UserSubscription | null;
  setActiveTab: (tab: string) => void;
  refetchSubscription: () => void;
  refetchWallet: () => void;
}

export function BillingPlans({
  subscription,
  setActiveTab,
  refetchSubscription,
  refetchWallet,
}: BillingPlansProps) {
  const { user } = useAuth();
  const {
    data: plansData,
    isLoading,
    error,
    refetch: refetchPlans,
  } = useGetBillingPlansQuery({ is_active: true, is_public: true });

  const handlePaymentSuccess = () => {
    setTimeout(() => {
      refetchPlans();
      refetchSubscription();
      refetchWallet();
    }, 1000);
  };

  const { handlePlanPurchase, isLoading: isPaymentLoading } = useRazorpayPayment({
    razorpayKey: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
    onSuccess: handlePaymentSuccess,
  });

  const activePlanId = subscription?.status === "active" ? subscription.plan_id : null;
  const plans = plansData?.data || [];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center w-full gap-6 sm:gap-8">
        <div className="text-center space-y-2">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-foreground">
            Start publishing tickets & streaming
          </h2>
          <p className="text-base sm:text-lg font-medium text-muted-foreground">
            CHOOSE A PLAN
          </p>
        </div>
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 justify-center items-stretch w-full max-w-5xl">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="flex-1 max-w-sm w-full bg-card/50 border-border/50">
              <CardHeader className="text-center">
                <div className="animate-pulse space-y-4">
                  <div className="h-6 bg-muted rounded w-1/2 mx-auto" />
                  <div className="h-4 bg-muted rounded w-1/3 mx-auto" />
                  <div className="h-8 bg-muted rounded w-1/4 mx-auto" />
                </div>
              </CardHeader>
              <CardContent className="flex flex-col items-center flex-1">
                <div className="animate-pulse h-10 bg-muted rounded w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Badge variant="destructive" className="text-sm">
          Error loading plans. Please try again later.
        </Badge>
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Badge variant="secondary" className="text-sm">
          No plans available at the moment.
        </Badge>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full gap-6 sm:gap-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-foreground">
          Start publishing tickets & streaming
        </h2>
        <p className="text-base sm:text-lg font-medium text-muted-foreground uppercase tracking-wide">
          Choose a Plan
        </p>
      </div>

      {/* Plans Grid */}
      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 justify-center items-stretch w-full max-w-5xl">
        {plans.map((plan: BillingPlan) => {
          const isActive = activePlanId === plan.id;
          const isProPlan = plan.name.toLowerCase() === "pro";
          const isPremiumActive = plans.some(
            (p: BillingPlan) =>
              p.name.toLowerCase() === "premium" && p.id === activePlanId
          );

          let buttonLabel = "BUY";
          let buttonVariant: "default" | "outline" = "default";
          let buttonDisabled = false;

          if (isActive) {
            buttonLabel = "ACTIVE";
            buttonVariant = "outline";
            buttonDisabled = true;
          } else if (isProPlan && isPremiumActive) {
            buttonLabel = "CONTACT US";
          }

          return (
            <Card
              key={plan.id}
              className={`flex-1 max-w-sm w-full flex flex-col justify-between transition-all duration-300 ${
                isActive
                  ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20"
                  : "bg-card/50 border-border/50 hover:border-border hover:bg-card/80"
              }`}
            >
              <CardHeader className="text-center pb-4">
                {isActive && (
                  <Badge className="w-fit mx-auto mb-2 bg-primary/10 text-primary border-primary/20">
                    <Crown className="w-3 h-3 mr-1" />
                    Current Plan
                  </Badge>
                )}
                <CardTitle className="text-lg sm:text-xl font-bold text-foreground">
                  {plan.name}
                </CardTitle>
                {plan.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {plan.description}
                  </p>
                )}
                <div className="mt-4">
                  <span className="text-2xl sm:text-3xl font-bold text-foreground">
                    ₹{plan.price.toLocaleString()}
                  </span>
                  <span className="text-muted-foreground">
                    /{plan.billing_cycle === "yearly" ? "yr" : "mo"}
                  </span>
                </div>
                {plan.initial_tickets > 0 && (
                  <p className="text-sm text-primary font-medium mt-2">
                    Includes {plan.initial_tickets.toLocaleString()} tickets
                  </p>
                )}
              </CardHeader>

              <CardContent className="flex flex-col flex-1">
                {plan.features && plan.features.length > 0 && (
                  <ul className="space-y-2.5 mb-6 flex-1">
                    {plan.features.map((feature: PlanFeature, i: number) => {
                      const Icon = getIcon(feature.icon || 'ticket');
                      const featureLabel = feature.label || feature.name || '';
                      return (
                        <li
                          key={i}
                          className="flex items-start gap-2.5 text-sm text-muted-foreground"
                        >
                          <Icon className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                          <span>{featureLabel}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}

                <Button
                  variant={buttonVariant}
                  disabled={buttonDisabled || isPaymentLoading}
                  className="w-full"
                  onClick={() => {
                    if (buttonLabel === "BUY" && !buttonDisabled) {
                      handlePlanPurchase(
                        plan.id,
                        plan.name,
                        plan.price,
                        plan.currency,
                        {
                          email: user?.email,
                          phone: user?.phone,
                        }
                      );
                    } else if (buttonLabel === "CONTACT US") {
                      // watch.rekard.com (IP: 147.93.153.29)
                      window.open("https://watch.rekard.com/contact", "_blank");
                    }
                  }}
                >
                  {isPaymentLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    buttonLabel
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* How It Works Section */}
      <div className="text-center mt-6 sm:mt-8 space-y-3">
        <h3 className="font-semibold text-sm sm:text-base text-foreground uppercase tracking-wide">
          How It Works
        </h3>
        <p className="text-sm sm:text-base text-muted-foreground italic">
          Step 1: Choose Plan → Step 2: Buy Tickets → Step 3: Sell
        </p>
      </div>

      {/* Already Have Plan Link */}
      <div className="w-full flex flex-col items-center">
        <div className="w-full max-w-2xl border-t border-dashed border-border/50 my-4" />
        <p className="text-sm sm:text-base text-muted-foreground">
          Already have a plan?{" "}
          <button
            className="text-primary underline font-medium hover:text-primary/80 transition-colors"
            onClick={() => setActiveTab("tickets")}
          >
            Buy Tickets
          </button>
        </p>
        <div className="w-full max-w-2xl border-t border-dashed border-border/50 my-4" />
      </div>
    </div>
  );
}

