"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  useGetUserWalletQuery,
  useGetTicketPricingQuery,
  UserSubscription,
} from "@/store/api";
import { useRazorpayPayment } from "@/hooks/useRazorpayPayment";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  Info,
  ShoppingCart,
  AlertTriangle,
  Loader2,
  Ticket,
  TrendingUp,
} from "lucide-react";

interface TicketsPurchaseProps {
  setActiveTab?: (tab: string) => void;
  subscription?: UserSubscription | null;
}

export function TicketsPurchase({ setActiveTab, subscription }: TicketsPurchaseProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(500);
  const minTickets = 10;
  const maxTickets = 10000;

  const { data: walletData, isLoading: isWalletLoading, refetch: refetchWallet } = useGetUserWalletQuery();
  const { data: pricingData, isLoading: isPricingLoading } = useGetTicketPricingQuery(
    { quantity, currency: "INR" },
    { skip: quantity < minTickets || quantity > maxTickets }
  );

  const handlePaymentSuccess = () => {
    setTimeout(() => {
      refetchWallet();
    }, 1000);
  };

  const { handleTicketPurchase, isLoading: isPaymentLoading } = useRazorpayPayment({
    razorpayKey: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
    onSuccess: handlePaymentSuccess,
  });

  const handlePurchase = async () => {
    const hasActivePlan = subscription && subscription.status === "active";
    if (!hasActivePlan) {
      toast({
        title: "Plan Required",
        description: "You need an active plan to purchase tickets.",
        variant: "destructive",
      });
      if (setActiveTab) {
        setActiveTab("plans");
      }
      return;
    }

    if (quantity < minTickets) {
      toast({
        title: "Invalid Quantity",
        description: `Minimum ${minTickets} tickets required.`,
        variant: "destructive",
      });
      return;
    }

    if (!pricingData?.data) {
      toast({
        title: "Error",
        description: "Unable to get pricing information.",
        variant: "destructive",
      });
      return;
    }

    await handleTicketPurchase(
      quantity,
      pricingData.data.unit_price,
      "INR",
      {
        email: user?.email,
        phone: user?.phone,
      }
    );
    setQuantity(500);
  };

  const isLoading = isWalletLoading || isPricingLoading;
  const wallet = walletData?.data;
  const pricing = pricingData?.data;
  const currentBalance = wallet?.ticket_balance || 0;

  const getBalanceColor = (balance: number) => {
    if (balance >= 100) return "text-emerald-400";
    if (balance >= 20) return "text-amber-400";
    return "text-red-400";
  };

  const getBalanceStatus = (balance: number) => {
    if (balance >= 100) return null;
    if (balance >= 20) return "Moderate balance";
    return "Low balance alert";
  };

  const balanceColor = getBalanceColor(currentBalance);
  const balanceStatus = getBalanceStatus(currentBalance);

  if (isLoading) {
    return (
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Tickets
          </CardTitle>
          <CardDescription>Manage your ticket balance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-8 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <div className="flex items-center gap-2 text-sm sm:text-base text-muted-foreground mb-2">
              <TrendingUp className="w-4 h-4" />
              TICKETS USED
            </div>
            <div className="text-3xl sm:text-4xl font-bold text-foreground">0</div>
            <Button variant="link" className="mt-2 text-xs sm:text-sm text-primary">
              View Details
            </Button>
          </CardContent>
        </Card>

        <Card className={`bg-card/50 border-border/50 ${currentBalance < 20 ? "border-red-500/30" : ""}`}>
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <div className={`flex items-center gap-2 text-sm sm:text-base ${balanceColor}`}>
              {currentBalance < 20 && <AlertTriangle className="w-4 h-4" />}
              <Ticket className="w-4 h-4" />
              TICKETS AVAILABLE
            </div>
            <div className={`text-3xl sm:text-4xl font-bold ${balanceColor}`}>
              {currentBalance.toLocaleString()}
            </div>
            {balanceStatus && (
              <div className={`text-xs ${balanceColor} mt-2`}>{balanceStatus}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Purchase Section */}
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col items-center gap-6">
            <div className="text-center">
              <h3 className="font-semibold text-lg sm:text-xl text-foreground mb-2">
                Buy Tickets for Your Events
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Each ticket = 1 user access (paid or free)
              </p>
            </div>

            {/* Slider Section */}
            <div className="w-full max-w-xl space-y-4">
              <div className="text-center">
                <label className="text-sm font-medium text-foreground">
                  How many tickets do you need?
                </label>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-xs sm:text-sm text-muted-foreground w-12 text-right">
                  {minTickets}
                </span>
                <Slider
                  min={minTickets}
                  max={maxTickets}
                  value={[quantity]}
                  onValueChange={([val]) => setQuantity(val || minTickets)}
                  step={10}
                  className="flex-1"
                />
                <span className="text-xs sm:text-sm text-muted-foreground w-12">
                  {maxTickets.toLocaleString()}
                </span>
              </div>

              {/* Quantity Input */}
              <div className="flex justify-center">
                <div className="bg-secondary/50 rounded-lg px-6 py-3">
                  <span className="text-2xl sm:text-3xl font-bold text-foreground">
                    {quantity.toLocaleString()}
                  </span>
                  <span className="text-muted-foreground ml-2">tickets</span>
                </div>
              </div>
            </div>

            {/* Pricing Display */}
            <div className="text-center space-y-2">
              {isPricingLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading pricing...
                </div>
              ) : pricing ? (
                <>
                  <div className="text-xl sm:text-2xl font-semibold text-foreground">
                    ₹{pricing.total_price.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    ₹{pricing.unit_price} per ticket
                  </div>
                </>
              ) : null}
            </div>

            {/* Purchase Button */}
            <Button
              onClick={handlePurchase}
              disabled={isPaymentLoading || isPricingLoading || !pricing}
              className="w-full sm:w-64"
              size="lg"
            >
              {isPaymentLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                `Buy ${quantity.toLocaleString()} Tickets`
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info Section */}
      <Card className="bg-muted/30 border-border/30">
        <CardContent className="p-4 sm:p-6 flex gap-4 items-start">
          <Info className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground space-y-1.5">
            <p className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              Tickets have no expiry
            </p>
            <p className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              Tickets are reusable for any event
            </p>
            <p className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              Your audience can pay any amount you set for your tickets
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

