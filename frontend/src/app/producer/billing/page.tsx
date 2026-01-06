"use client";

import React, { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Navbar } from "@/components/layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BillingPlans, TicketsPurchase } from "@/components/billing";
import { useGetUserSubscriptionQuery, useGetUserWalletQuery } from "@/store/api";
import { CreditCard, Ticket, Sparkles } from "lucide-react";

function BillingContent() {
  const [activeTab, setActiveTab] = useState<string>("plans");
  const [hasInitialized, setHasInitialized] = useState(false);

  const { 
    data: subscriptionData, 
    refetch: refetchSubscription 
  } = useGetUserSubscriptionQuery();

  const { 
    data: walletData, 
    refetch: refetchWallet 
  } = useGetUserWalletQuery();

  const subscription = subscriptionData?.data;
  const hasActivePlan = subscription && subscription.status === "active";

  // Handle URL params for tab switching and set default based on active plan
  useEffect(() => {
    if (typeof window !== "undefined" && !hasInitialized) {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get("tab");
      if (tabParam && ["plans", "tickets"].includes(tabParam)) {
        setActiveTab(tabParam);
        setHasInitialized(true);
      } else if (subscriptionData !== undefined) {
        // Subscription data has loaded, set default based on active plan
        if (hasActivePlan) {
          setActiveTab("tickets");
        }
        // If no active plan, keep "plans" as default (already set)
        setHasInitialized(true);
      }
    }
  }, [hasActivePlan, subscriptionData, hasInitialized]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Gradient orbs */}
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/5 dark:bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-3xl" />
        
        {/* Grid pattern - theme aware */}
        <div 
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(hsl(var(--foreground) / 0.1) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--foreground) / 0.1) 1px, transparent 1px)
            `,
            backgroundSize: "64px 64px",
          }}
        />
      </div>

      <Navbar />

      <main className="container mx-auto px-4 lg:px-6 py-8 relative z-10">
        {/* Tabs */}
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab} 
          className="space-y-6"
        >
          <TabsList className="grid w-full max-w-md grid-cols-2 mx-auto sm:mx-0">
            <TabsTrigger 
              value="plans" 
              className="flex items-center gap-2 text-sm"
            >
              <CreditCard className="w-4 h-4" />
              Plans
            </TabsTrigger>
            <TabsTrigger 
              value="tickets" 
              className="flex items-center gap-2 text-sm"
            >
              <Ticket className="w-4 h-4" />
              Tickets
            </TabsTrigger>
          </TabsList>

          <TabsContent value="plans" className="mt-6">
            <BillingPlans
              subscription={subscription}
              setActiveTab={setActiveTab}
              refetchSubscription={refetchSubscription}
              refetchWallet={refetchWallet}
            />
          </TabsContent>

          <TabsContent value="tickets" className="mt-6">
            <TicketsPurchase
              setActiveTab={setActiveTab}
              subscription={subscription}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default function BillingPage() {
  return (
    <ProtectedRoute>
      <BillingContent />
    </ProtectedRoute>
  );
}

