// Plan-based access control middleware
import { Response, NextFunction } from 'express';
import type { AppRequest, PlanTier } from '../types/index.js';
import { getTenantContext } from './tenant.js';
import * as billingService from '../../domains/billing/service.js';
import * as billingRepo from '../../domains/billing/repository.js';

// Re-export PlanTier for convenience
export type { PlanTier };

// Plan hierarchy for comparison
const PLAN_HIERARCHY: Record<PlanTier, number> = {
  free: 0,
  pro: 1,
  premium: 2,
};

// Pro features that require at least Pro plan
export const PRO_FEATURES = [
  'payment-gateway',
  'custom-domain',
  'payment-receiver',
  'sms-gateway',
  'email-gateway',
] as const;

// Premium features that require Premium plan
export const PREMIUM_FEATURES = [
  'white-label',
  'priority-support',
  'analytics',
] as const;

export type ProFeature = typeof PRO_FEATURES[number];
export type PremiumFeature = typeof PREMIUM_FEATURES[number];

/**
 * Check if a plan tier has access to a feature based on required tier
 */
export function hasFeatureAccess(currentPlan: PlanTier, requiredPlan: PlanTier): boolean {
  return PLAN_HIERARCHY[currentPlan] >= PLAN_HIERARCHY[requiredPlan];
}

/**
 * Get the plan tier from a plan name
 */
export function getPlanTier(planName: string | null | undefined): PlanTier {
  if (!planName) return 'free';
  const normalizedName = planName.toLowerCase().trim();
  if (normalizedName === 'premium') return 'premium';
  if (normalizedName === 'pro') return 'pro';
  return 'free';
}

/**
 * Get the user's current plan tier
 */
export async function getUserPlanTier(
  appId: string,
  tenantId: string,
  userId: string
): Promise<{ planTier: PlanTier; isActive: boolean; planName: string | null }> {
  try {
    const subscription = await billingService.getSubscription(appId, tenantId, userId);
    
    if (!subscription || subscription.status !== 'active') {
      return { planTier: 'free', isActive: false, planName: null };
    }
    
    // Get the plan details
    const plan = await billingRepo.getBillingPlanById(appId, tenantId, subscription.plan_id);
    
    if (!plan) {
      return { planTier: 'free', isActive: false, planName: null };
    }
    
    const planTier = getPlanTier(plan.name);
    
    return {
      planTier,
      isActive: true,
      planName: plan.name,
    };
  } catch (error) {
    console.error('Error getting user plan tier:', error);
    return { planTier: 'free', isActive: false, planName: null };
  }
}

/**
 * Middleware factory to require a minimum plan tier
 * @param requiredPlan - The minimum plan tier required to access the route
 * @param featureName - Optional feature name for better error messages
 */
export function requirePlan(requiredPlan: PlanTier, featureName?: string) {
  return async (req: AppRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenant = getTenantContext(req);
      
      if (!tenant.userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }
      
      const { planTier, isActive, planName } = await getUserPlanTier(
        tenant.appId,
        tenant.tenantId,
        tenant.userId
      );
      
      // Check if user has required plan access
      if (!hasFeatureAccess(planTier, requiredPlan)) {
        const feature = featureName || 'this feature';
        res.status(403).json({
          success: false,
          error: `Upgrade required`,
          message: `Access to ${feature} requires a ${requiredPlan} plan or higher. Your current plan: ${planName || 'Free'}`,
          required_plan: requiredPlan,
          current_plan: planTier,
          is_active: isActive,
        });
        return;
      }
      
      // Attach plan info to request for downstream use
      req.planInfo = {
        planTier,
        planName,
        isActive,
      };
      
      next();
    } catch (error) {
      console.error('Plan check middleware error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to verify plan access',
      });
    }
  };
}

/**
 * Convenience middleware for Pro plan features
 */
export const requireProPlan = (featureName?: string) => requirePlan('pro', featureName);

/**
 * Middleware factory to require exactly Pro plan (not Premium)
 * @param featureName - Optional feature name for better error messages
 */
export function requireExactProPlan(featureName?: string) {
  return async (req: AppRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenant = getTenantContext(req);
      
      if (!tenant.userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }
      
      const { planTier, isActive, planName } = await getUserPlanTier(
        tenant.appId,
        tenant.tenantId,
        tenant.userId
      );
      
      // Check if user has exactly Pro plan (not Premium)
      if (planTier !== 'pro' || !isActive) {
        const feature = featureName || 'this feature';
        res.status(403).json({
          success: false,
          error: `Pro plan required`,
          message: `Access to ${feature} requires a Pro plan (Premium plan not eligible). Your current plan: ${planName || 'Free'}`,
          required_plan: 'pro',
          current_plan: planTier,
          is_active: isActive,
        });
        return;
      }
      
      // Attach plan info to request for downstream use
      req.planInfo = {
        planTier,
        planName,
        isActive,
      };
      
      next();
    } catch (error) {
      console.error('Plan check middleware error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to verify plan access',
      });
    }
  };
}

/**
 * Convenience middleware for Premium plan features
 */
export const requirePremiumPlan = (featureName?: string) => requirePlan('premium', featureName);

