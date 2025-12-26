"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UpgradeButton } from "@/components/ui/upgrade-button";
import {
  CheckCircle,
  Circle,
  ArrowRight,
  ArrowLeft,
  Save,  
  Loader2,
} from "lucide-react";
import { ConfigurationsSection } from "./ConfigurationsSection";
import { HeaderSection } from "./HeaderSection";
import { FooterSection } from "./FooterSection";
import { HomeSection } from "./HomeSection";
import { WatchPageSection } from "./WatchPageSection";
import {
  FORM_STEPS,
  type FormStep,
  type PlatformFormData,
} from "./types";

interface PlatformFormProps {
  formData: PlatformFormData;
  isLoading?: boolean;
  isSubmitting?: boolean;
  isReadOnly?: boolean;
  onChange: (data: Partial<PlatformFormData>) => void;
  onSubmit: (data: PlatformFormData) => void;
}

export function PlatformForm({
  formData,
  isLoading = false,
  isSubmitting = false,
  isReadOnly = false,
  onChange,
  onSubmit,
}: PlatformFormProps) {
  // Step state
  const [currentStep, setCurrentStep] = useState<FormStep>("configurations");
  const [visitedSteps, setVisitedSteps] = useState<Set<FormStep>>(new Set(["configurations"]));

  const currentStepIndex = FORM_STEPS.findIndex((step) => step.key === currentStep);

  // Step validation - platform settings are mostly optional
  const isStepValid = (step: FormStep): boolean => {
    switch (step) {
      case "configurations":
        // Configurations is always valid (Pro features have their own validation)
        return true;
      case "header":
        // Header is always valid (cart and coupons are optional)
        return true;
      case "footer":
        // Footer is always valid (all fields are optional)
        return true;
      case "home":
        // Home is always valid (banners and language are optional)
        return true;
      case "watch-page":
        // Watch page is always valid
        return true;
      default:
        return true;
    }
  };

  // Navigation handlers
  const handleStepNavigation = (step: FormStep) => {
    setCurrentStep(step);
    setVisitedSteps((prev) => new Set([...prev, step]));
  };

  const handleNextStep = () => {
    if (currentStepIndex < FORM_STEPS.length - 1) {
      const nextStep = FORM_STEPS[currentStepIndex + 1]?.key;
      if (nextStep) {
        handleStepNavigation(nextStep);
      }
    }
  };

  const handlePreviousStep = () => {
    if (currentStepIndex > 0) {
      const prevStep = FORM_STEPS[currentStepIndex - 1]?.key;
      if (prevStep) {
        handleStepNavigation(prevStep);
      }
    }
  };

  // Submit handler
  const handleSubmit = () => {
    onSubmit(formData);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="relative">
            <Loader2 className="h-12 w-12 text-foreground mx-auto animate-spin" />
          </div>
          <div className="space-y-2">
            <p className="text-lg font-medium text-foreground">Loading platform settings...</p>
            <p className="text-sm text-muted-foreground">Please wait while we prepare your settings</p>
          </div>
        </div>
      </div>
    );
  }

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case "configurations":
        return <ConfigurationsSection />;

      case "header":
        return (
          <HeaderSection
            formData={formData}
            onChange={onChange}
            isReadOnly={isReadOnly}
          />
        );

      case "footer":
        return (
          <FooterSection
            formData={formData}
            onChange={onChange}
            isReadOnly={isReadOnly}
          />
        );

      case "home":
        return (
          <HomeSection
            formData={formData}
            onChange={onChange}
            isReadOnly={isReadOnly}
          />
        );

      case "watch-page":
        return (
          <WatchPageSection
            formData={formData}
            onChange={onChange}
            isReadOnly={isReadOnly}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      {/* Step Navigation */}
      <div className="bg-secondary rounded-xl p-4 border border-border">
        <div className="flex items-center justify-center gap-2 overflow-x-auto">
          {FORM_STEPS.map((step, index) => {
            const isVisited = visitedSteps.has(step.key);
            const isCurrent = currentStep === step.key;
            const isValid = isStepValid(step.key);

            return (
              <button
                key={step.key}
                type="button"
                onClick={() => handleStepNavigation(step.key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium min-w-max ${
                  isCurrent
                    ? "bg-foreground text-background"
                    : isValid && isVisited
                    ? "bg-foreground/20 text-foreground hover:bg-foreground/30"
                    : isVisited
                    ? "bg-muted text-foreground/70 hover:bg-muted/80"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                }`}
              >
                {isValid && isVisited ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <Circle className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">{step.title}</span>
                <span className="sm:hidden">{index + 1}</span>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground text-center mt-3">
          {FORM_STEPS[currentStepIndex]?.description}
        </p>
      </div>

      {/* Form Content */}
      <div className="bg-card rounded-2xl border border-border p-6 md:p-8">
        {renderStepContent()}
      </div>

      {/* Navigation Actions */}
      <div className="flex items-center justify-between bg-secondary rounded-xl p-4 border border-border">
        <div className="flex items-center gap-3">
          {currentStepIndex > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={handlePreviousStep}
              className="bg-background border-border text-foreground hover:bg-muted"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Save or Upgrade button */}
          {isReadOnly ? (
            <UpgradeButton tooltipText="Upgrade to Pro to save platform settings" />
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-background border-border text-foreground hover:bg-muted disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </>
              )}
            </Button>
          )}

          {/* Next button - only on non-final steps */}
          {currentStepIndex < FORM_STEPS.length - 1 && (
            <Button
              type="button"
              onClick={handleNextStep}
              className="bg-foreground hover:bg-foreground/90 text-background"
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

