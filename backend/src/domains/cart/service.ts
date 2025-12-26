// Cart service - business logic
import * as repo from './repository.js';
import * as ticketsRepo from '../tickets/repository.js';
import type {
  Cart,
  CartSummary,
  CartWithSummary,
  AddToCartRequest,
  UpdateCartItemRequest,
} from './types.js';
import { log } from '../../shared/middleware/logger.js';
import { badRequest, notFound } from '../../shared/errors/app-error.js';

const DEFAULT_TAX_RATE = 0.0; // Can be configured

// Calculate cart summary
const calculateSummary = (cart: Cart): CartSummary => {
  const items = cart.items || [];
  const coupons = cart.coupons || [];

  const subtotal = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  const discountAmount = coupons.reduce((sum, c) => sum + c.discount_amount, 0);
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = taxableAmount * DEFAULT_TAX_RATE;
  const total = taxableAmount + taxAmount;
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const currency = items.length > 0 ? items[0].currency : 'INR';

  return {
    subtotal,
    discount_amount: discountAmount,
    tax_amount: taxAmount,
    total,
    item_count: itemCount,
    currency,
  };
};

// Get cart with summary
export const getCart = async (
  appId: string,
  tenantId: string,
  userId: string
): Promise<CartWithSummary> => {
  const cart = await repo.getOrCreateCart(appId, tenantId, userId);
  return {
    ...cart,
    summary: calculateSummary(cart),
  };
};

// Add item to cart
export const addToCart = async (
  appId: string,
  tenantId: string,
  userId: string,
  data: AddToCartRequest
): Promise<CartWithSummary> => {
  // Validate ticket exists and is available
  const ticket = await ticketsRepo.getTicketById(appId, tenantId, data.ticket_id, false);
  if (!ticket) {
    throw notFound('Ticket');
  }

  if (ticket.status !== 'published') {
    throw badRequest('Ticket is not available for purchase');
  }

  // Check availability
  const remainingQuantity = ticket.total_quantity - ticket.sold_quantity;
  if (remainingQuantity < data.quantity) {
    throw badRequest(`Only ${remainingQuantity} tickets available`);
  }

  const cart = await repo.getOrCreateCart(appId, tenantId, userId);

  // Check max quantity per user
  const existingItem = (cart.items || []).find((i) => i.ticket_id === data.ticket_id);
  const currentQuantity = existingItem ? existingItem.quantity : 0;

  if (currentQuantity + data.quantity > ticket.max_quantity_per_user) {
    throw badRequest(`Maximum ${ticket.max_quantity_per_user} tickets allowed per user`);
  }

  await repo.addCartItem(
    cart.id,
    data.ticket_id,
    data.quantity,
    data.unit_price,
    data.currency || 'INR'
  );

  log.info(`Added ticket ${data.ticket_id} to cart for user ${userId}`);

  // Return updated cart
  return getCart(appId, tenantId, userId);
};

// Update cart item
export const updateCartItem = async (
  appId: string,
  tenantId: string,
  userId: string,
  ticketId: number,
  data: UpdateCartItemRequest
): Promise<CartWithSummary> => {
  const cart = await repo.getCartByUser(appId, tenantId, userId);
  if (!cart) {
    throw notFound('Cart');
  }

  const existingItem = (cart.items || []).find((i) => i.ticket_id === ticketId);
  if (!existingItem) {
    throw notFound('Cart item');
  }

  if (data.quantity <= 0) {
    await repo.removeCartItem(cart.id, ticketId);
  } else {
    // Check max quantity
    const ticket = await ticketsRepo.getTicketById(appId, tenantId, ticketId, false);
    if (ticket && data.quantity > ticket.max_quantity_per_user) {
      throw badRequest(`Maximum ${ticket.max_quantity_per_user} tickets allowed per user`);
    }

    await repo.updateCartItem(cart.id, ticketId, data.quantity, data.unit_price);
  }

  log.info(`Updated cart item for ticket ${ticketId}`);
  return getCart(appId, tenantId, userId);
};

// Remove item from cart
export const removeFromCart = async (
  appId: string,
  tenantId: string,
  userId: string,
  ticketId: number
): Promise<CartWithSummary> => {
  const cart = await repo.getCartByUser(appId, tenantId, userId);
  if (!cart) {
    throw notFound('Cart');
  }

  const removed = await repo.removeCartItem(cart.id, ticketId);
  if (!removed) {
    throw notFound('Cart item');
  }

  log.info(`Removed ticket ${ticketId} from cart for user ${userId}`);
  return getCart(appId, tenantId, userId);
};

// Clear cart
export const clearCart = async (
  appId: string,
  tenantId: string,
  userId: string
): Promise<void> => {
  const cart = await repo.getCartByUser(appId, tenantId, userId);
  if (!cart) {
    return; // Nothing to clear
  }

  await repo.clearCart(cart.id);
  log.info(`Cleared cart for user ${userId}`);
};

// Apply coupon
export const applyCoupon = async (
  appId: string,
  tenantId: string,
  userId: string,
  couponCode: string
): Promise<CartWithSummary> => {
  const cart = await repo.getCartByUser(appId, tenantId, userId);
  if (!cart) {
    throw notFound('Cart');
  }

  if (!cart.items || cart.items.length === 0) {
    throw badRequest('Cart is empty');
  }

  // Validate coupon for the first ticket in cart
  const firstItem = cart.items[0];
  const coupon = await ticketsRepo.getCouponByCode(appId, tenantId, firstItem.ticket_id, couponCode);

  if (!coupon) {
    throw badRequest('Invalid coupon code');
  }

  if (!coupon.is_active) {
    throw badRequest('Coupon is not active');
  }

  const now = new Date();
  if (coupon.activation_time && new Date(coupon.activation_time) > now) {
    throw badRequest('Coupon is not yet valid');
  }
  if (coupon.expiry_time && new Date(coupon.expiry_time) < now) {
    throw badRequest('Coupon has expired');
  }

  // Calculate discount based on cart subtotal
  const subtotal = cart.items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  const discountAmount = Math.min((subtotal * coupon.discount) / 100, subtotal);

  await repo.applyCoupon(cart.id, couponCode, discountAmount, 'percentage');

  log.info(`Applied coupon ${couponCode} to cart for user ${userId}`);
  return getCart(appId, tenantId, userId);
};

// Remove coupon
export const removeCoupon = async (
  appId: string,
  tenantId: string,
  userId: string,
  couponCode: string
): Promise<CartWithSummary> => {
  const cart = await repo.getCartByUser(appId, tenantId, userId);
  if (!cart) {
    throw notFound('Cart');
  }

  const removed = await repo.removeCoupon(cart.id, couponCode);
  if (!removed) {
    throw notFound('Coupon');
  }

  log.info(`Removed coupon ${couponCode} from cart for user ${userId}`);
  return getCart(appId, tenantId, userId);
};

// Get cart summary only
export const getCartSummary = async (
  appId: string,
  tenantId: string,
  userId: string
): Promise<CartSummary> => {
  const cart = await repo.getOrCreateCart(appId, tenantId, userId);
  return calculateSummary(cart);
};

// Mark cart as checked out
export const checkoutCart = async (
  appId: string,
  tenantId: string,
  userId: string
): Promise<void> => {
  const cart = await repo.getCartByUser(appId, tenantId, userId);
  if (!cart) {
    throw notFound('Cart');
  }

  await repo.updateCartStatus(cart.id, 'checked_out');
  log.info(`Cart checked out for user ${userId}`);
};

