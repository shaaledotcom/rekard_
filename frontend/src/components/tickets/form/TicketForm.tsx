"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle, 
  Circle, 
  ArrowRight, 
  ArrowLeft, 
  Save,
  Loader2
} from "lucide-react";
import type { Event } from "@/store/api";
import { useToast } from "@/hooks/use-toast";
import { usePlan } from "@/hooks/usePlan";
import { BasicInfoSection } from "./BasicInfoSection";
import { MediaSection } from "./MediaSection";
import { EventsSelectionSection } from "./EventsSelectionSection";
import { PricingSection } from "./PricingSection";
import { SettingsSection } from "./SettingsSection";
import { CouponSection } from "./CouponSection";
import { SponsorsSection } from "./SponsorsSection";
import { 
  FORM_STEPS, 
  DEFAULT_TICKET_FORM_VALUES,
  type FormStep, 
  type TicketFormData,
  type MediaFiles 
} from "./types";

interface TicketFormProps {
  initialData?: Partial<TicketFormData>;
  ticketId?: number;
  isLoading?: boolean;
  isSubmitting?: boolean;
  isReadOnly?: boolean;
  events: Event[];
  eventsLoading: boolean;
  totalEvents: number;
  totalEventsPages: number;
  currentEventsPage: number;
  eventsSearchQuery: string;
  onEventsSearch: (query: string) => void;
  onEventsPageChange: (page: number) => void;
  onSubmit: (data: TicketFormData, mediaFiles: MediaFiles) => void;
  onCancel: () => void;
}

export function TicketForm({
  initialData,
  ticketId,
  isLoading = false,
  isSubmitting = false,
  isReadOnly = false,
  events,
  eventsLoading,
  totalEvents,
  totalEventsPages,
  currentEventsPage,
  eventsSearchQuery,
  onEventsSearch,
  onEventsPageChange,
  onSubmit,
  onCancel,
}: TicketFormProps) {
  const { toast } = useToast();
  const { canPublish } = usePlan();
  
  // Form state
  const [formData, setFormData] = useState<TicketFormData>({
    ...DEFAULT_TICKET_FORM_VALUES,
    ...initialData,
  });
  const [mediaFiles, setMediaFiles] = useState<MediaFiles>({});
  const [hasInitialized, setHasInitialized] = useState(false);

  // Step state
  const [currentStep, setCurrentStep] = useState<FormStep>("basic-details");
  const [visitedSteps, setVisitedSteps] = useState<Set<FormStep>>(new Set(["basic-details"]));

  const currentStepIndex = FORM_STEPS.findIndex((step) => step.key === currentStep);

  // Sync form data when initialData changes (e.g., after API fetch on edit page)
  useEffect(() => {
    if (initialData && !hasInitialized) {
      setFormData({
        ...DEFAULT_TICKET_FORM_VALUES,
        ...initialData,
      });
      setHasInitialized(true);
    }
  }, [initialData, hasInitialized]);

  // Reset initialization flag when ticketId changes (switching between tickets)
  useEffect(() => {
    setHasInitialized(false);
  }, [ticketId]);

  // Scroll to top when step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStep]);

  // Form change handler - memoized to prevent infinite loops in child useEffects
  const handleFormChange = useCallback((data: Partial<TicketFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  }, []);

  // Media files change handler - memoized for consistency
  const handleMediaFilesChange = useCallback((files: MediaFiles) => {
    setMediaFiles(files);
  }, []);

  // Step validation
  const isStepValid = (step: FormStep): boolean => {
    switch (step) {
      case "basic-details":
        return !!(formData.title && formData.title.length >= 3 && formData.url && formData.url.length >= 3);
      case "settings": {
        const basicValid = !!(
          formData.event_ids.length > 0 &&
          formData.pricing.length > 0 &&
          formData.pricing[0]?.price >= 0
        );
        // If geoblocking is enabled, at least one rule must be added
        const geoblockingValid = !formData.geoblocking_enabled || 
          (formData.geoblocking_countries && formData.geoblocking_countries.length > 0);
        return basicValid && geoblockingValid;
      }
      case "coupons-sponsors":
        return true; // Optional step
      default:
        return false;
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

  // Get specific validation errors for a step
  const getValidationErrors = (step: FormStep): string[] => {
    const errors: string[] = [];
    
    if (step === "basic-details") {
      if (!formData.title || formData.title.length < 3) {
        errors.push("Title must be at least 3 characters");
      }
      if (!formData.url || formData.url.length < 3) {
        errors.push("URL must be at least 3 characters");
      }
    }
    
    if (step === "settings") {
      if (formData.event_ids.length === 0) {
        errors.push("At least one event must be selected");
      }
      if (formData.pricing.length === 0) {
        errors.push("Pricing information is required");
      } else if (formData.pricing[0]?.price === undefined || formData.pricing[0]?.price < 0) {
        errors.push("Price must be 0 or greater");
      }
      // Validate geoblocking rules
      if (formData.geoblocking_enabled && 
          (!formData.geoblocking_countries || formData.geoblocking_countries.length === 0)) {
        errors.push("Geo-blocking is enabled but no locations are blocked. Please add at least one location or disable geo-blocking");
      }
    }
    
    return errors;
  };

  // Submit handler
  const handleSubmit = () => {
    // Validate all steps
    const step1Valid = isStepValid("basic-details");
    const step2Valid = isStepValid("settings");

    if (!step1Valid) {
      const errors = getValidationErrors("basic-details");
      toast({
        title: "Basic Details Incomplete",
        description: errors.join(". "),
        variant: "destructive",
      });
      handleStepNavigation("basic-details");
      return;
    }

    if (!step2Valid) {
      const errors = getValidationErrors("settings");
      toast({
        title: "Settings Incomplete",
        description: errors.join(". "),
        variant: "destructive",
      });
      handleStepNavigation("settings");
      return;
    }

    // Check if trying to publish without plan - automatically save as draft
    const isPublishingStatus = formData.status === "published" || formData.status === "sold_out";
    if (isPublishingStatus && !canPublish) {
      toast({
        title: "Saved as Draft",
        description: "You need an active plan and tickets in your wallet to publish. Your ticket has been saved as draft. Please upgrade your plan to publish it.",
        duration: 6000,
      });
      // Update form data to draft status
      const draftFormData = { ...formData, status: "draft" as const };
      onSubmit(draftFormData, mediaFiles);
      return;
    }

    onSubmit(formData, mediaFiles);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="relative">
            <Loader2 className="h-12 w-12 text-foreground mx-auto" />
          </div>
          <div className="space-y-2">
            <p className="text-lg font-medium text-foreground">Loading ticket data...</p>
            <p className="text-sm text-muted-foreground">Please wait while we prepare your form</p>
          </div>
        </div>
      </div>
    );
  }

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case "basic-details":
        return (
          <div className="space-y-8">
            <BasicInfoSection
              formData={formData}
              onChange={handleFormChange}
              isReadOnly={isReadOnly}
            />
            <MediaSection
              formData={formData}
              mediaFiles={mediaFiles}
              onChange={handleFormChange}
              onMediaFilesChange={handleMediaFilesChange}
              isReadOnly={isReadOnly}
            />
          </div>
        );

      case "settings":
        return (
          <div className="space-y-10">
            <EventsSelectionSection
              formData={formData}
              events={events}
              totalEvents={totalEvents}
              totalPages={totalEventsPages}
              currentPage={currentEventsPage}
              isLoading={eventsLoading}
              searchQuery={eventsSearchQuery}
              onChange={handleFormChange}
              onSearch={onEventsSearch}
              onPageChange={onEventsPageChange}
              isReadOnly={isReadOnly}
            />
            <PricingSection
              formData={formData}
              onChange={handleFormChange}
              isReadOnly={isReadOnly}
            />
            <SettingsSection
              formData={formData}
              onChange={handleFormChange}
              isReadOnly={isReadOnly}
            />
          </div>
        );

      case "coupons-sponsors":
        return (
          <div className="space-y-10">
            <CouponSection
              formData={formData}
              onChange={handleFormChange}
              isReadOnly={isReadOnly}
            />
            <SponsorsSection
              formData={formData}
              onChange={handleFormChange}
              isReadOnly={isReadOnly}
            />
          </div>
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
                    : isValid
                    ? "bg-foreground/20 text-foreground hover:bg-foreground/30"
                    : isVisited
                    ? "bg-muted text-foreground/70 hover:bg-muted/80"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                }`}
              >
                {isValid ? (
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
      {!isReadOnly && (
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
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              disabled={isSubmitting}
              className="text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              Cancel
            </Button>

            {currentStepIndex < FORM_STEPS.length - 1 ? (
              <Button
                type="button"
                onClick={handleNextStep}
                disabled={!ticketId && !isStepValid(currentStep)}
                className="bg-foreground hover:bg-foreground/90 text-background disabled:opacity-50"
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || (!ticketId && (!isStepValid("basic-details") || !isStepValid("settings")))}
                className="bg-foreground hover:bg-foreground/90 text-background disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {ticketId ? "Update Ticket" : "Create Ticket"}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

