"use client";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Navbar } from "@/components/layout";
import { usePlatformForm } from "@/hooks/usePlatformForm";
import { PlatformForm, PlatformBackground } from "@/components/platform";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UpgradeButton } from "@/components/ui/upgrade-button";
import { usePlan } from "@/hooks/usePlan";
import { Crown, Shield, AlertTriangle, Lock } from "lucide-react";

function PlatformContent() {
  const { formData, isLoading, isSubmitting, handleFormChange, handleSubmit } = usePlatformForm();
  const { planTier, hasProFeatures, hasActivePlan, ticketBalance, isLoading: isPlanLoading } = usePlan();

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden">
      <PlatformBackground />

      <Navbar />

      <main className="container mx-auto px-4 lg:px-6 py-8 relative z-10">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-foreground">Platform Settings</h1>
                {!hasProFeatures && !isPlanLoading && (
                  <Badge variant="secondary" className="gap-1">
                    <Lock className="h-3 w-3" />
                    Pro Only
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground">
                Configure your platform appearance, functionality, and branding
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge 
                variant={hasProFeatures ? "default" : "secondary"} 
                className="gap-1"
              >
                {hasProFeatures ? (
                  <>
                    <Crown className="h-3 w-3" />
                    {planTier === "premium" ? "Premium" : "Pro"} Plan
                  </>
                ) : (
                  <>
                    <Shield className="h-3 w-3" />
                    {hasActivePlan ? "Active" : "Free"} Plan
                  </>
                )}
              </Badge>
              {hasActivePlan && (
                <Badge variant="outline" className="gap-1">
                  {ticketBalance} tickets
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Upgrade Banner - Show prominently when user doesn't have Pro */}
        {!hasProFeatures && !isPlanLoading && (
          <Card className="mb-6 border-destructive/30 bg-destructive/5">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-destructive/10">
                    <AlertTriangle className="h-6 w-6 text-destructive" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      Unlock Full Branding & Whitelabel Features
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Customize your platform with logo, footer, payment gateway, subdomain, and more. 
                      Available exclusively with the Pro Plan.
                    </p>
                  </div>
                </div>
                <UpgradeButton className="shrink-0 bg-destructive hover:bg-destructive/90 text-white">
                  Upgrade to Pro
                </UpgradeButton>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Platform Form - Pass isReadOnly based on plan */}
        <PlatformForm
          formData={formData}
          isLoading={isLoading}
          isSubmitting={isSubmitting}
          isReadOnly={!hasProFeatures}
          onChange={handleFormChange}
          onSubmit={handleSubmit}
        />
      </main>
    </div>
  );
}

export default function ProducerPlatformPage() {
  return (
    <ProtectedRoute>
      <PlatformContent />
    </ProtectedRoute>
  );
}
