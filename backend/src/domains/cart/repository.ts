// Cart repository - tenant-aware database operations using Drizzle ORM
import { eq, and } from 'drizzle-orm';
import { db, carts, cartItems, cartCoupons, tickets } from '../../db/index';
import type {
  Cart,
  CartItem,
  CartCoupon,
  CartStatus,
} from './types';

// Transform cart item with ticket details
const transformCartItem = (item: typeof cartItems.$inferSelect, ticket?: Partial<typeof tickets.$inferSelect>): CartItem => {
  return {
    id: item.id,
    cart_id: item.cartId,
    ticket_id: item.ticketId,
    quantity: item.quantity,
    unit_price: item.unitPrice ? parseFloat(item.unitPrice) : 0,
    currency: item.currency ?? 'INR',
    metadata: item.metadata as Record<string, unknown>,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
    ticket: ticket ? {
      id: ticket.id!,
      title: ticket.title!,
      description: ticket.description ?? undefined,
      thumbnail_image_portrait: ticket.thumbnailImagePortrait ?? undefined,
      featured_image: ticket.featuredImage ?? undefined,
      url: ticket.url ?? undefined,
      status: ticket.status ?? 'draft',
    } : undefined,
  };
};

// Get or create cart for user
export const getCartByUser = async (
  appId: string,
  tenantId: string,
  userId: string
): Promise<Cart | null> => {
  const [cart] = await db
    .select()
    .from(carts)
    .where(
      and(
        eq(carts.appId, appId),
        eq(carts.tenantId, tenantId),
        eq(carts.userId, userId),
        eq(carts.status, 'active')
      )
    )
    .limit(1);

  if (!cart) return null;

  const items = await getCartItems(cart.id);
  const coupons = await getCartCoupons(cart.id);

  return {
    id: cart.id,
    app_id: cart.appId,
    tenant_id: cart.tenantId,
    user_id: cart.userId,
    status: (cart.status as CartStatus) ?? 'active',
    created_at: cart.createdAt,
    updated_at: cart.updatedAt,
    items,
    coupons,
  };
};

export const createCart = async (
  appId: string,
  tenantId: string,
  userId: string
): Promise<Cart> => {
  const [cart] = await db
    .insert(carts)
    .values({
      appId,
      tenantId,
      userId,
      status: 'active',
    })
    .returning();

  return {
    id: cart.id,
    app_id: cart.appId,
    tenant_id: cart.tenantId,
    user_id: cart.userId,
    status: (cart.status as CartStatus) ?? 'active',
    created_at: cart.createdAt,
    updated_at: cart.updatedAt,
    items: [],
    coupons: [],
  };
};

export const getOrCreateCart = async (
  appId: string,
  tenantId: string,
  userId: string
): Promise<Cart> => {
  let cart = await getCartByUser(appId, tenantId, userId);
  if (!cart) {
    cart = await createCart(appId, tenantId, userId);
  }
  return cart;
};

// Cart items
export const getCartItems = async (cartId: number): Promise<CartItem[]> => {
  const items = await db
    .select({
      item: cartItems,
      ticket: {
        id: tickets.id,
        title: tickets.title,
        description: tickets.description,
        thumbnailImagePortrait: tickets.thumbnailImagePortrait,
        featuredImage: tickets.featuredImage,
        url: tickets.url,
        status: tickets.status,
      },
    })
    .from(cartItems)
    .leftJoin(tickets, eq(cartItems.ticketId, tickets.id))
    .where(eq(cartItems.cartId, cartId));

  return items.map(({ item, ticket }) => transformCartItem(item, ticket || undefined));
};

export const addCartItem = async (
  cartId: number,
  ticketId: number,
  quantity: number,
  unitPrice: number,
  currency: string
): Promise<CartItem> => {
  // Check if item already exists
  const [existingItem] = await db
    .select()
    .from(cartItems)
    .where(
      and(
        eq(cartItems.cartId, cartId),
        eq(cartItems.ticketId, ticketId)
      )
    )
    .limit(1);

  if (existingItem) {
    return updateCartItem(cartId, ticketId, existingItem.quantity + quantity, unitPrice);
  }

  const [item] = await db
    .insert(cartItems)
    .values({
      cartId,
      ticketId,
      quantity,
      unitPrice: unitPrice.toString(),
      currency: currency || 'INR',
      metadata: {},
    })
    .returning();

  return transformCartItem(item);
};

export const updateCartItem = async (
  cartId: number,
  ticketId: number,
  quantity: number,
  unitPrice?: number
): Promise<CartItem> => {
  const updates: Partial<typeof cartItems.$inferInsert> = {
    quantity,
    updatedAt: new Date(),
  };
  if (unitPrice !== undefined) {
    updates.unitPrice = unitPrice.toString();
  }

  const [item] = await db
    .update(cartItems)
    .set(updates)
    .where(
      and(
        eq(cartItems.cartId, cartId),
        eq(cartItems.ticketId, ticketId)
      )
    )
    .returning();

  return transformCartItem(item);
};

export const removeCartItem = async (
  cartId: number,
  ticketId: number
): Promise<boolean> => {
  const result = await db
    .delete(cartItems)
    .where(
      and(
        eq(cartItems.cartId, cartId),
        eq(cartItems.ticketId, ticketId)
      )
    )
    .returning({ id: cartItems.id });

  return result.length > 0;
};

export const clearCart = async (cartId: number): Promise<void> => {
  await db.delete(cartItems).where(eq(cartItems.cartId, cartId));
  await db.delete(cartCoupons).where(eq(cartCoupons.cartId, cartId));
};

// Cart coupons
export const getCartCoupons = async (cartId: number): Promise<CartCoupon[]> => {
  const coupons = await db
    .select()
    .from(cartCoupons)
    .where(eq(cartCoupons.cartId, cartId));

  return coupons.map(c => ({
    id: c.id,
    cart_id: c.cartId,
    coupon_code: c.couponCode,
    discount_amount: c.discountAmount ? parseFloat(c.discountAmount) : 0,
    discount_type: c.discountType,
    applied_at: c.appliedAt,
  }));
};

export const applyCoupon = async (
  cartId: number,
  couponCode: string,
  discountAmount: number,
  discountType: string
): Promise<CartCoupon> => {
  // Remove existing coupon with same code
  await db
    .delete(cartCoupons)
    .where(
      and(
        eq(cartCoupons.cartId, cartId),
        eq(cartCoupons.couponCode, couponCode)
      )
    );

  const [coupon] = await db
    .insert(cartCoupons)
    .values({
      cartId,
      couponCode,
      discountAmount: discountAmount.toString(),
      discountType,
      appliedAt: new Date(),
    })
    .returning();

  return {
    id: coupon.id,
    cart_id: coupon.cartId,
    coupon_code: coupon.couponCode,
    discount_amount: coupon.discountAmount ? parseFloat(coupon.discountAmount) : 0,
    discount_type: coupon.discountType,
    applied_at: coupon.appliedAt,
  };
};

export const removeCoupon = async (
  cartId: number,
  couponCode: string
): Promise<boolean> => {
  const result = await db
    .delete(cartCoupons)
    .where(
      and(
        eq(cartCoupons.cartId, cartId),
        eq(cartCoupons.couponCode, couponCode)
      )
    )
    .returning({ id: cartCoupons.id });

  return result.length > 0;
};

// Update cart status
export const updateCartStatus = async (
  cartId: number,
  status: string
): Promise<boolean> => {
  const result = await db
    .update(carts)
    .set({ status, updatedAt: new Date() })
    .where(eq(carts.id, cartId))
    .returning({ id: carts.id });

  return result.length > 0;
};
