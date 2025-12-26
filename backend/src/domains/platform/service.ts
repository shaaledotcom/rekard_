// Platform settings service
import * as repo from './repository.js';
import type {
  PlatformSettings,
  UpdatePlatformSettingsRequest,
  ValidateCouponRequest,
  CouponValidationResult,
} from './types.js';
import { log } from '../../shared/middleware/logger.js';

export const getSettings = async (
  appId: string,
  tenantId: string
): Promise<PlatformSettings | null> => {
  log.debug(`Fetching platform settings for app=${appId}, tenant=${tenantId}`);
  return repo.getByAppAndTenant(appId, tenantId);
};

export const updateSettings = async (
  appId: string,
  tenantId: string,
  data: UpdatePlatformSettingsRequest
): Promise<PlatformSettings> => {
  log.info(`Updating platform settings for app=${appId}, tenant=${tenantId}`);
  return repo.upsert(appId, tenantId, data);
};

export const validateCoupon = async (
  appId: string,
  tenantId: string,
  request: ValidateCouponRequest
): Promise<CouponValidationResult> => {
  const coupon = await repo.getCouponByCode(appId, tenantId, request.code);

  if (!coupon) {
    return { valid: false, error: 'Coupon not found' };
  }

  if (!coupon.is_active) {
    return { valid: false, error: 'Coupon is not active' };
  }

  const now = new Date();
  if (coupon.valid_from && new Date(coupon.valid_from) > now) {
    return { valid: false, error: 'Coupon is not yet valid' };
  }
  if (coupon.valid_until && new Date(coupon.valid_until) < now) {
    return { valid: false, error: 'Coupon has expired' };
  }

  if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
    return { valid: false, error: 'Coupon usage limit reached' };
  }

  if (coupon.min_purchase && request.purchase_amount < coupon.min_purchase) {
    return {
      valid: false,
      error: `Minimum purchase amount of ${coupon.min_purchase} required`,
    };
  }

  let discountAmount: number;
  if (coupon.discount_type === 'percentage') {
    discountAmount = (request.purchase_amount * coupon.discount_value) / 100;
    if (coupon.max_discount) {
      discountAmount = Math.min(discountAmount, coupon.max_discount);
    }
  } else {
    discountAmount = coupon.discount_value;
  }

  discountAmount = Math.min(discountAmount, request.purchase_amount);

  return {
    valid: true,
    coupon,
    discount_amount: discountAmount,
  };
};

export const applyCoupon = async (
  appId: string,
  tenantId: string,
  code: string
): Promise<boolean> => {
  const result = await repo.updateCouponUsage(appId, tenantId, code);
  if (result) {
    log.info(`Applied coupon ${code} for tenant ${tenantId}`);
  }
  return result;
};

