"use client";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Navbar } from "@/components/layout";
import { usePlatformForm } from "@/hooks/usePlatformForm";
import { PlatformForm, PlatformBackground } from "@/components/platform";

function PlatformContent() {
  const { formData, isLoading, isSubmitting, handleFormChange, handleSubmit } = usePlatformForm();

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden">
      <PlatformBackground />

      <Navbar />

      <main className="container mx-auto px-4 lg:px-6 py-8 relative z-10">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Platform Settings</h1>
          <p className="text-muted-foreground">
            Configure your platform appearance, policies, and functionality
          </p>
        </div>

        {/* Platform Form */}
        <PlatformForm
          formData={formData}
          isLoading={isLoading}
          isSubmitting={isSubmitting}
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

