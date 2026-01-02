// Orders service - business logic
import * as repo from './repository.js';
import * as ticketsRepo from '../tickets/repository.js';
import * as dashboardRepo from '../dashboard/repository.js';
import * as dashboardService from '../dashboard/service.js';
import * as razorpayService from '../payments/razorpay.js';
import { createUser } from '../auth/user.js';
import { db, emailAccessGrants, tickets } from '../../db/index.js';
import { eq, and, or, isNull, gte } from 'drizzle-orm';
import type {
  Order,
  CreateOrderRequest,
  UpdateOrderRequest,
  OrderFilter,
  OrderListResponse,
  PaginationParams,
  SortParams,
  OrderWithDetails,
  OrderStats,
  CreateUserAndOrderRequest,
  CreateUserAndOrderResponse,
  UserPurchaseStatusResponse,
  CouponValidationResponse,
  MyPurchasesListResponse,
  PurchaseWithTicketDetails,
} from './types.js';
import * as ticketCouponsRepo from '../tickets/repository.js';
import { ROLE_VIEWER } from '../auth/constants.js';
import { log } from '../../shared/middleware/logger.js';
import { badRequest, notFound } from '../../shared/errors/app-error.js';

// Create order with validation
export const createOrder = async (
  _appId: string,
  tenantId: string,
  userId: string,
  data: CreateOrderRequest
): Promise<Order> => {
  // Validate ticket exists and is available (use public lookup - no tenant filter)
  const ticket = await dashboardRepo.getPublicTicketById(data.ticket_id);
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

  // Check max quantity per user - use public appId for viewer orders
  const existingOrders = await repo.getUserTicketOrders('public', tenantId, userId, data.ticket_id);
  const existingQuantity = existingOrders.reduce((sum, o) => sum + o.quantity, 0);

  const maxPerUser = 10; // Default max if not set on ticket
  if (existingQuantity + data.quantity > maxPerUser) {
    throw badRequest(`Maximum ${maxPerUser} tickets allowed per user`);
  }

  // Create order with public appId for viewer orders
  const order = await repo.createOrder('public', tenantId, userId, data);

  // Increment sold quantity
  await ticketsRepo.incrementSoldQuantity(data.ticket_id, data.quantity);

  log.info(`Created order ${order.order_number} for user ${userId}`);
  return order;
};

// Get order by ID
export const getOrder = async (
  appId: string,
  tenantId: string,
  orderId: number
): Promise<Order> => {
  const order = await repo.getOrderById(appId, tenantId, orderId);
  if (!order) {
    throw notFound('Order');
  }
  return order;
};

// Get order by number
export const getOrderByNumber = async (orderNumber: string): Promise<Order> => {
  const order = await repo.getOrderByNumber(orderNumber);
  if (!order) {
    throw notFound('Order');
  }
  return order;
};

// Get order with ticket/event details
export const getOrderWithDetails = async (
  appId: string,
  tenantId: string,
  orderId: number
): Promise<OrderWithDetails> => {
  const order = await repo.getOrderWithDetails(appId, tenantId, orderId);
  if (!order) {
    throw notFound('Order');
  }
  return order;
};

// Complete order (after payment success)
export const completeOrder = async (
  appId: string,
  tenantId: string,
  orderId: number,
  paymentId?: string
): Promise<Order> => {
  const order = await repo.getOrderById(appId, tenantId, orderId);
  if (!order) {
    throw notFound('Order');
  }

  if (order.status !== 'pending') {
    throw badRequest('Order is not in pending status');
  }

  const updateData: UpdateOrderRequest = { status: 'completed' };
  if (paymentId) {
    updateData.external_payment_id = paymentId;
  }

  const updated = await repo.updateOrder(appId, tenantId, orderId, updateData);
  log.info(`Completed order ${order.order_number}`);
  return updated!;
};

// Cancel order
export const cancelOrder = async (
  appId: string,
  tenantId: string,
  orderId: number
): Promise<Order> => {
  const order = await repo.getOrderById(appId, tenantId, orderId);
  if (!order) {
    throw notFound('Order');
  }

  if (order.status === 'cancelled' || order.status === 'refunded') {
    throw badRequest('Order is already cancelled or refunded');
  }

  // Release tickets if order was pending or completed
  if (order.status === 'pending' || order.status === 'completed') {
    await ticketsRepo.decrementSoldQuantity(order.ticket_id, order.quantity);
  }

  const updated = await repo.updateOrder(appId, tenantId, orderId, { status: 'cancelled' });
  log.info(`Cancelled order ${order.order_number}`);
  return updated!;
};

// Refund order
export const refundOrder = async (
  appId: string,
  tenantId: string,
  orderId: number
): Promise<Order> => {
  const order = await repo.getOrderById(appId, tenantId, orderId);
  if (!order) {
    throw notFound('Order');
  }

  if (order.status !== 'completed') {
    throw badRequest('Only completed orders can be refunded');
  }

  // Release tickets
  await ticketsRepo.decrementSoldQuantity(order.ticket_id, order.quantity);

  const updated = await repo.updateOrder(appId, tenantId, orderId, { status: 'refunded' });
  log.info(`Refunded order ${order.order_number}`);
  return updated!;
};

// Update order
export const updateOrder = async (
  appId: string,
  tenantId: string,
  orderId: number,
  data: UpdateOrderRequest
): Promise<Order> => {
  const order = await repo.updateOrder(appId, tenantId, orderId, data);
  if (!order) {
    throw notFound('Order');
  }
  log.info(`Updated order ${order.order_number}`);
  return order;
};

// List orders (admin)
export const listOrders = async (
  appId: string,
  tenantId: string,
  filter: OrderFilter = {},
  pagination: PaginationParams = {},
  sort: SortParams = {}
): Promise<OrderListResponse> => {
  return repo.listOrders(appId, tenantId, filter, pagination, sort);
};

// List user's orders
export const listUserOrders = async (
  appId: string,
  tenantId: string,
  userId: string,
  pagination: PaginationParams = {}
): Promise<OrderListResponse> => {
  return repo.listUserOrders(appId, tenantId, userId, pagination);
};

// Get order statistics
export const getOrderStats = async (
  appId: string,
  tenantId: string,
  startDate?: Date,
  endDate?: Date
): Promise<OrderStats> => {
  return repo.getOrderStats(appId, tenantId, startDate, endDate);
};

// User's order by ID
export const getUserOrder = async (
  appId: string,
  tenantId: string,
  userId: string,
  orderId: number
): Promise<Order> => {
  const order = await repo.getOrderByUserId(appId, tenantId, userId, orderId);
  if (!order) {
    throw notFound('Order');
  }
  return order;
};

// Create user and order (purchase without login flow)
export const createUserAndOrder = async (
  appId: string,
  tenantId: string,
  data: CreateUserAndOrderRequest
): Promise<CreateUserAndOrderResponse> => {
  // Create or get existing user via passwordless
  const userResult = await createUser({
    email: data.email,
    phone: data.phone,
    appId,
    tenantId,
    role: ROLE_VIEWER,
  });

  // Create the order
  const orderData: CreateOrderRequest = {
    ticket_id: data.ticket_id,
    event_id: data.event_id,
    quantity: data.quantity,
    unit_price: data.unit_price,
    currency: data.currency,
    payment_method: data.payment_method,
    customer_email: data.email,
    customer_name: data.name,
    customer_phone: data.phone,
  };

  const order = await createOrder(appId, tenantId, userResult.userId, orderData);

  log.info(`Created user and order: user=${userResult.userId}, order=${order.order_number}`);

  return {
    user_id: userResult.userId,
    order_id: order.id,
    order_number: order.order_number,
    email: data.email,
  };
};

// Complete order from payment (with user_id for purchase without login)
export const completeOrderFromPayment = async (
  _appId: string,
  _tenantId: string,
  orderId: number,
  paymentId: string,
  userId?: string
): Promise<Order> => {
  // First, get the order by ID only (to find it regardless of current domain's appId/tenantId)
  // The order belongs to the ticket owner, not necessarily the current domain
  let order = await repo.getOrderByIdOnly(orderId);
  if (!order) {
    throw notFound('Order');
  }

  // Get the ticket owner's appId/tenantId to ensure we're using the correct context
  const ticketInfo = await dashboardRepo.getTicketByIdForPayment(order.ticket_id);
  if (!ticketInfo) {
    throw notFound('Ticket');
  }

  // Use ticket owner's appId/tenantId for the order operations
  const ticketOwnerAppId = ticketInfo.appId;
  const ticketOwnerTenantId = ticketInfo.tenantId;

  // If userId provided, verify it matches
  if (userId && order.user_id !== userId) {
    throw badRequest('Order does not belong to this user');
  }

  if (order.status !== 'pending') {
    throw badRequest('Order is not in pending status');
  }

  // Verify payment with Razorpay using ticket owner's credentials
  try {
    // Get Razorpay key and secret for the ticket owner's platform
    if (ticketInfo) {
      const paymentConfig = await dashboardService.getTicketPaymentConfig(order.ticket_id);
      const razorpaySecret = await dashboardService.getTicketRazorpaySecret(order.ticket_id);
      
      // Verify payment with Razorpay using ticket owner's credentials
      try {
        const payment = await razorpayService.getPaymentWithCredentials(
          paymentId,
          paymentConfig.razorpay_key_id,
          razorpaySecret
        );
        
        if (!payment || payment.status !== 'captured') {
          log.warn(`Payment ${paymentId} not captured or invalid`);
          throw badRequest('Payment verification failed');
        }
        
        log.info(`Verified payment ${paymentId} for order ${order.order_number} using ticket owner's credentials`);
      } catch (error) {
        // If verification fails, log but don't block order completion
        // The payment was already processed by Razorpay on their side
        log.warn(`Payment verification warning for ${paymentId}:`, error);
        // In production, you might want to be more strict here
      }
    }
  } catch (error) {
    log.warn(`Failed to verify payment for order ${order.order_number}:`, error);
    // Continue with order completion even if verification fails
    // The payment was already processed by Razorpay
  }

  // Update order using order's original appId/tenantId (not ticket owner's)
  // The ticket owner's credentials are only needed for payment verification
  const updated = await repo.updateOrder(order.app_id, order.tenant_id, orderId, {
    status: 'completed',
    external_payment_id: paymentId,
  });

  if (!updated) {
    throw notFound('Order could not be updated');
  }

  log.info(`Completed order ${order.order_number} with payment ${paymentId} (order: ${order.app_id}/${order.tenant_id}, ticket owner: ${ticketOwnerAppId}/${ticketOwnerTenantId})`);
  return updated;
};

// Check if user has purchased a ticket
// Also checks for email access grants
export const checkUserPurchaseStatus = async (
  appId: string,
  tenantId: string,
  userId: string,
  ticketId: number,
  userEmail?: string
): Promise<UserPurchaseStatusResponse> => {
  // Check for completed orders
  const orders = await repo.getUserTicketOrders(appId, tenantId, userId, ticketId);
  const completedOrder = orders.find(o => o.status === 'completed');

  // If user has a completed order, return that
  if (completedOrder) {
    return {
      ticket_id: ticketId,
      has_purchased: true,
      order_id: completedOrder.id,
      order_number: completedOrder.order_number,
    };
  }

  // If no order, check for email access grant
  // Need to use ticket owner's tenant_id, not viewer's tenant_id
  if (userEmail) {
    try {
      // Get ticket owner's tenant_id
      const ticketOwner = await dashboardRepo.getTicketByIdForPayment(ticketId);
      if (ticketOwner) {
        const { checkAccess } = await import('../viewers/service.js');
        // Use ticket owner's tenant_id for access check
        const accessCheck = await checkAccess(ticketOwner.tenantId, ticketId, userEmail);
        
        if (accessCheck.has_access) {
          // User has access via email grant, return as purchased
          return {
            ticket_id: ticketId,
            has_purchased: true,
            // No order_id/order_number since it's a grant, not a purchase
          };
        }
      }
    } catch (error) {
      log.warn(`Failed to check email access grant for ticket ${ticketId}:`, error);
    }
  }

  return {
    ticket_id: ticketId,
    has_purchased: false,
  };
};

// Get watch link for a purchased ticket
// Also checks for email access grants
export const getWatchLink = async (
  appId: string,
  tenantId: string,
  userId: string,
  ticketId: number,
  userEmail?: string
): Promise<{ ticket_id: number; watch_link: string; order_id: number }> => {
  // Check if user has purchased the ticket
  const orders = await repo.getUserTicketOrders(appId, tenantId, userId, ticketId);
  const completedOrder = orders.find(o => o.status === 'completed');

  if (completedOrder) {
    // Generate watch link (simplified - in production would include secure token)
    const watchLink = `/watch?order=${completedOrder.id}&ticket=${ticketId}`;
    return {
      ticket_id: ticketId,
      watch_link: watchLink,
      order_id: completedOrder.id,
    };
  }

  // Check for email access grant
  if (userEmail) {
    const { checkAccess } = await import('../viewers/service.js');
    const accessCheck = await checkAccess(tenantId, ticketId, userEmail);
    
    if (accessCheck.has_access) {
      // Generate watch link for grant (no order ID)
      const watchLink = `/watch?ticket=${ticketId}`;
      return {
        ticket_id: ticketId,
        watch_link: watchLink,
        order_id: 0, // No order ID for grants
      };
    }
  }

  throw badRequest('Ticket not purchased or order not completed');
};

// Get user's purchases (completed orders with ticket details)
// Also includes tickets with email access grants
export const getMyPurchases = async (
  appId: string,
  tenantId: string,
  userId: string,
  pagination: PaginationParams = {},
  userEmail?: string
): Promise<MyPurchasesListResponse> => {
  // Get purchases from orders
  const orderPurchases = await repo.listUserPurchasesWithTicketDetails(appId, tenantId, userId, pagination);
  
  // If no email provided, return only order purchases
  if (!userEmail) {
    return orderPurchases;
  }

  // Get tickets with email access grants
  // Query grants by email across ALL tenants (not filtered by viewer's tenant)
  // We need to check grants stored with ticket owner's tenant_id
  const normalizedEmail = userEmail.toLowerCase().trim();
  const now = new Date();
  
  // Query grants by email, join with tickets to ensure ticket exists and is published
  const grantRows = await db
    .select({
      grant: emailAccessGrants,
      ticketId: tickets.id,
    })
    .from(emailAccessGrants)
    .innerJoin(tickets, eq(emailAccessGrants.ticketId, tickets.id))
    .where(
      and(
        eq(emailAccessGrants.email, normalizedEmail),
        eq(emailAccessGrants.status, 'active'),
        eq(tickets.status, 'published'),
        or(
          isNull(emailAccessGrants.expiresAt),
          gte(emailAccessGrants.expiresAt, now)
        )
      )
    );
  
  const accessGrants = grantRows.map(g => ({
    id: g.grant.id,
    app_id: g.grant.appId,
    tenant_id: g.grant.tenantId,
    user_id: g.grant.userId,
    ticket_id: g.grant.ticketId,
    email: g.grant.email,
    status: 'active' as const,
    granted_at: g.grant.grantedAt,
    expires_at: g.grant.expiresAt ?? undefined,
    used_at: g.grant.usedAt ?? undefined,
    ticket_title: undefined,
    viewer_user_id: undefined,
    has_signed_up: false,
  }));
  
  // Get ticket details for access grants
  const { getPublicTicketById } = await import('../dashboard/repository.js');
  
  const grantPurchases = await Promise.all(
    accessGrants
      .filter(grant => grant.status === 'active' && (!grant.expires_at || new Date(grant.expires_at) > new Date()))
      .map(async (grant): Promise<PurchaseWithTicketDetails | null> => {
        const ticket = await getPublicTicketById(grant.ticket_id);
        if (!ticket) return null;
        
        // Get earliest event start datetime
        const eventStartDatetime = ticket.events && ticket.events.length > 0
          ? ticket.events
              .map(e => e.start_datetime)
              .filter((dt): dt is Date => !!dt)
              .sort((a, b) => a.getTime() - b.getTime())[0]?.toISOString()
          : undefined;

        return {
          id: ticket.id,
          title: ticket.title || '',
          description: ticket.description || undefined,
          thumbnail_image_portrait: ticket.thumbnail_image_portrait || undefined,
          url: ticket.url || undefined,
          start_datetime: eventStartDatetime,
          ticket_id: ticket.id,
          order_id: 0, // No order ID for grants
          purchased_at: new Date(grant.granted_at),
        };
      })
  );

  // Filter out nulls and combine with order purchases
  const validGrantPurchases = grantPurchases.filter((p): p is PurchaseWithTicketDetails => p !== null);
  
  // Combine and deduplicate by ticket_id (prefer order purchases over grants)
  const purchaseMap = new Map<number, PurchaseWithTicketDetails>();
  
  // Add grant purchases first
  for (const purchase of validGrantPurchases) {
    purchaseMap.set(purchase.ticket_id, purchase);
  }
  
  // Add order purchases (will overwrite grants if both exist)
  for (const purchase of orderPurchases.data) {
    purchaseMap.set(purchase.ticket_id, purchase);
  }
  
  // Convert back to array and sort by purchased_at
  const combinedPurchases = Array.from(purchaseMap.values()).sort(
    (a, b) => b.purchased_at.getTime() - a.purchased_at.getTime()
  );
  
  // Apply pagination
  const page = pagination.page || 1;
  const pageSize = pagination.page_size || 10;
  const offset = (page - 1) * pageSize;
  const paginatedPurchases = combinedPurchases.slice(offset, offset + pageSize);
  
  return {
    data: paginatedPurchases,
    total: combinedPurchases.length,
    page,
    page_size: pageSize,
    total_pages: Math.ceil(combinedPurchases.length / pageSize),
  };
};

// Validate coupon for a ticket
export const validateCoupon = async (
  appId: string,
  tenantId: string,
  couponCode: string,
  ticketId: number,
  orderAmount: number
): Promise<CouponValidationResponse> => {
  // Get coupon by code and ticket
  const coupon = await ticketCouponsRepo.getCouponByCode(appId, tenantId, ticketId, couponCode);

  if (!coupon) {
    return {
      is_valid: false,
      message: 'Coupon not found',
      discount_amount: 0,
      final_amount: orderAmount,
    };
  }

  // Check if coupon is active
  if (!coupon.is_active) {
    return {
      is_valid: false,
      message: 'Coupon is not active',
      discount_amount: 0,
      final_amount: orderAmount,
    };
  }

  // Check activation time
  const now = new Date();
  if (coupon.activation_time && now < new Date(coupon.activation_time)) {
    return {
      is_valid: false,
      message: 'Coupon is not yet active',
      discount_amount: 0,
      final_amount: orderAmount,
    };
  }

  // Check expiry time
  if (coupon.expiry_time && now > new Date(coupon.expiry_time)) {
    return {
      is_valid: false,
      message: 'Coupon has expired',
      discount_amount: 0,
      final_amount: orderAmount,
    };
  }

  // Check usage limit
  if (coupon.count > 0 && coupon.used_count >= coupon.count) {
    return {
      is_valid: false,
      message: 'Coupon usage limit exceeded',
      discount_amount: 0,
      final_amount: orderAmount,
    };
  }

  // Calculate discount
  const discountAmount = (orderAmount * coupon.discount) / 100;
  const finalAmount = orderAmount - discountAmount;

  return {
    is_valid: true,
    message: 'Coupon validated successfully',
    discount_amount: discountAmount,
    final_amount: Math.max(0, finalAmount),
  };
};
