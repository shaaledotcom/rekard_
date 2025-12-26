"use client";

import * as React from "react";
import { Crown, Lock, ExternalLink, AlertTriangle, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Card, CardContent } from "./card";
import { Badge } from "./badge";
import { usePlan, PlanTier, hasFeatureAccess } from "@/hooks/usePlan";

interface UpgradeButtonProps {
  className?: string;
  tooltipText?: string;
  onClick?: () => void;
  children?: React.ReactNode;
  variant?: "default" | "secondary" | "outline" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
}

/**
 * Button that prompts users to upgrade their plan
 * Automatically navigates to the billing page
 */
export function UpgradeButton({
  className,
  tooltipText = "Upgrade to the Pro plan to unlock this feature",
  onClick,
  children = "Upgrade to Pro",
  variant = "default",
  size = "default",
}: UpgradeButtonProps) {
  const router = useRouter();
  const { hasActivePlan } = usePlan();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      const baseUrl = "/producer/billing";
      const targetTab = hasActivePlan ? "tickets" : "plans";
      router.push(`${baseUrl}?tab=${targetTab}`);
    }
  };

  return (
    <div className="relative group">
      <Button
        type="button"
        onClick={handleClick}
        variant={variant}
        size={size}
        className={cn("gap-2", className)}
      >
        <Crown className="h-4 w-4" />
        <span className="hidden sm:inline">{children}</span>
        <span className="sm:hidden">Upgrade</span>
      </Button>
      {/* Tooltip on hover */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-popover text-popover-foreground text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-border">
        {tooltipText}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-popover" />
      </div>
    </div>
  );
}

interface LockedSectionProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
  isLocked?: boolean;
  upgradeButtonText?: string;
  tooltipText?: string;
  onUpgrade?: () => void;
}

/**
 * Wrapper component that locks content behind a plan upgrade
 * Shows content in a disabled state with an upgrade prompt
 */
export function LockedSection({
  children,
  className,
  title,
  description,
  isLocked = true,
  upgradeButtonText = "Upgrade to Pro",
  tooltipText,
  onUpgrade,
}: LockedSectionProps) {
  if (!isLocked) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={cn("relative", className)}>
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 rounded-lg" />
      <div className="relative z-20 p-4 sm:p-6 border border-muted rounded-xl bg-muted/20">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <Lock className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              {title && (
                <h3 className="font-semibold text-foreground text-sm sm:text-base">
                  {title}
                </h3>
              )}
              {description && (
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  {description}
                </p>
              )}
            </div>
          </div>
          <UpgradeButton
            tooltipText={tooltipText}
            onClick={onUpgrade}
            className="shrink-0 w-full sm:w-auto"
          >
            {upgradeButtonText}
          </UpgradeButton>
        </div>
        <div className="opacity-40 pointer-events-none select-none">{children}</div>
      </div>
    </div>
  );
}

interface PlanGatedCardProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  requiredPlan?: PlanTier;
  className?: string;
}

/**
 * Card component that shows locked/unlocked state based on plan
 * Content is fully interactive when unlocked
 */
export function PlanGatedCard({
  children,
  title,
  description,
  icon,
  requiredPlan = "pro",
  className,
}: PlanGatedCardProps) {
  const { planTier } = usePlan();
  const isLocked = !hasFeatureAccess(planTier, requiredPlan);

  return (
    <Card className={cn(
      "transition-all duration-200",
      isLocked 
        ? "border-muted bg-muted/5" 
        : "border-border bg-card hover:border-border/80",
      className
    )}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {icon && (
              <div className={cn(
                "p-2 rounded-lg",
                isLocked 
                  ? "bg-muted/50 text-muted-foreground" 
                  : "bg-primary/10 text-primary"
              )}>
                {icon}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                {isLocked && <Lock className="h-4 w-4 text-muted-foreground" />}
                <h3 className={cn(
                  "font-semibold",
                  isLocked ? "text-muted-foreground" : "text-foreground"
                )}>
                  {title}
                </h3>
              </div>
              {description && (
                <p className="text-sm text-muted-foreground mt-1">{description}</p>
              )}
            </div>
          </div>
          {isLocked && (
            <Badge variant="secondary" className="text-xs">
              <Crown className="h-3 w-3 mr-1" />
              {requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1)}
            </Badge>
          )}
        </div>
        <div className={cn(isLocked && "opacity-40 pointer-events-none select-none")}>
          {children}
        </div>
        {isLocked && (
          <div className="mt-4 pt-4 border-t border-border">
            <UpgradeButton 
              className="w-full"
              tooltipText={`Upgrade to ${requiredPlan} to access this feature`}
            >
              Upgrade to {requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1)}
            </UpgradeButton>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface PublishingRestrictionAlertProps {
  className?: string;
  onUpgradeClick?: () => void;
}

/**
 * Alert component shown when user cannot publish due to plan/ticket requirements
 */
export function PublishingRestrictionAlert({
  className,
  onUpgradeClick,
}: PublishingRestrictionAlertProps) {
  const router = useRouter();
  const { hasActivePlan, hasTickets, canPublish } = usePlan();

  if (canPublish) {
    return null;
  }

  const handleClick = () => {
    if (onUpgradeClick) {
      onUpgradeClick();
    } else {
      router.push("/producer/billing");
    }
  };

  let message = "";
  let buttonText = "Go to Billing";

  if (!hasActivePlan && !hasTickets) {
    message = "You need an active plan and tickets in your wallet to publish. Please choose a plan and purchase tickets first.";
    buttonText = "Choose a Plan";
  } else if (!hasActivePlan) {
    message = "You need an active plan to publish. Please choose a plan first.";
    buttonText = "Choose a Plan";
  } else if (!hasTickets) {
    message = "You need tickets in your wallet to publish. Please purchase tickets first.";
    buttonText = "Buy Tickets";
  }

  return (
    <Card className={cn(
      "border-destructive/30 bg-destructive/5",
      className
    )}>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="p-2 rounded-lg bg-destructive/10">
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="destructive" className="text-xs">
                  Publishing Restricted
                </Badge>
              </div>
              <p className="text-sm text-destructive/90">{message}</p>
            </div>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleClick}
            className="shrink-0"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            {buttonText}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface PlanFeatureBadgeProps {
  requiredPlan: PlanTier;
  className?: string;
}

/**
 * Small badge indicating which plan is required for a feature
 */
export function PlanFeatureBadge({ requiredPlan, className }: PlanFeatureBadgeProps) {
  const { planTier } = usePlan();
  const hasAccess = hasFeatureAccess(planTier, requiredPlan);

  if (hasAccess) {
    return null;
  }

  return (
    <Badge 
      variant="secondary" 
      className={cn("text-xs gap-1", className)}
    >
      <Crown className="h-3 w-3" />
      {requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1)}
    </Badge>
  );
}

