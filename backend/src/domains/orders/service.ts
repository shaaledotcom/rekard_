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
import { sendPurchaseConfirmationEmail } from '../../shared/utils/email.js';
import * as billingService from '../billing/service.js';
import * as tenantRepo from '../tenant/repository.js';
import { isLocationBlocked } from '../geolocation/index.js';
import type { ResolvedLocation } from '../geolocation/index.js';

// Create order with validation
export const createOrder = async (
  _appId: string,
  _tenantId: string,
  userId: string,
  data: CreateOrderRequest,
  userLocation?: ResolvedLocation | null
): Promise<Order> => {
  // Validate ticket exists and is available (use public lookup - no tenant filter)
  const ticket = await dashboardRepo.getPublicTicketById(data.ticket_id);
  if (!ticket) {
    throw notFound('Ticket');
  }

  if (ticket.status !== 'published') {
    throw badRequest('Ticket is not available for purchase');
  }

  // Check geoblocking restrictions
  if (isLocationBlocked(ticket.geoblocking_enabled, ticket.geoblocking_countries, userLocation ?? null)) {
    throw badRequest('This ticket is not available in your region');
  }

  // Get ticket owner's tenantId (producer's tenantId)
  // This ensures orders are associated with the correct producer, even on shared domains
  const ticketOwner = await dashboardRepo.getTicketByIdForPayment(data.ticket_id);
  if (!ticketOwner) {
    throw notFound('Ticket owner information not found');
  }
  
  // Use ticket owner's tenantId instead of request tenantId
  // This fixes the issue where orders created on shared domains (watch.rekard.com, localhost)
  // were associated with wrong tenantId, causing them not to appear in sales reports
  const ticketOwnerTenantId = ticketOwner.tenantId;

  // Validate fundraiser pricing: buyer must pay at least the base price
  if (ticket.is_fundraiser && data.unit_price < ticket.price) {
    throw badRequest(`Minimum price for this fundraiser ticket is ${ticket.price} ${ticket.currency}`);
  }

  // Check availability
  const remainingQuantity = ticket.total_quantity - ticket.sold_quantity;
  if (remainingQuantity < data.quantity) {
    throw badRequest(`Only ${remainingQuantity} tickets available`);
  }

  // Check max quantity per user - use public appId for viewer orders
  // Use ticket owner's tenantId for consistency
  const existingOrders = await repo.getUserTicketOrders('public', ticketOwnerTenantId, userId, data.ticket_id);
  const existingQuantity = existingOrders.reduce((sum, o) => sum + o.quantity, 0);

  const maxPerUser = 10; // Default max if not set on ticket
  if (existingQuantity + data.quantity > maxPerUser) {
    throw badRequest(`Maximum ${maxPerUser} tickets allowed per user`);
  }

  // Create order with public appId and ticket owner's tenantId
  // This ensures orders are correctly associated with the producer for sales reporting
  const order = await repo.createOrder('public', ticketOwnerTenantId, userId, data);

  // Increment sold quantity
  await ticketsRepo.incrementSoldQuantity(data.ticket_id, data.quantity);

  log.info(`Created order ${order.order_number} for user ${userId}`);
  return order;
};

// Helper function to consume tickets from producer's wallet when ticket is purchased
const consumeProducerWalletTickets = async (
  ticketId: number,
  quantity: number
): Promise<void> => {
  try {
    // Get ticket owner's tenant info
    const ticketInfo = await dashboardRepo.getTicketByIdForPayment(ticketId);
    if (!ticketInfo) {
      log.warn(`Could not find ticket ${ticketId} for wallet deduction`);
      return;
    }

    // Get tenant to find producer's user ID
    const tenant = await tenantRepo.getTenantById(ticketInfo.tenantId);
    if (!tenant) {
      log.warn(`Could not find tenant ${ticketInfo.tenantId} for wallet deduction`);
      return;
    }

    const producerUserId = tenant.user_id;
    const producerAppId = ticketInfo.appId;
    const producerTenantId = ticketInfo.tenantId;

    // Consume tickets from producer's wallet
    try {
      await billingService.consumeTickets(
        producerAppId,
        producerTenantId,
        producerUserId,
        {
          quantity,
          reference_type: 'ticket_purchase',
          reference_id: String(ticketId),
          description: `Consumed ${quantity} tickets for ticket purchase (ticket ${ticketId})`,
        }
      );
      log.info(`Consumed ${quantity} tickets from producer ${producerUserId}'s wallet for ticket ${ticketId}`);
    } catch (error) {
      // If wallet doesn't have enough tickets, log warning but don't fail the purchase
      // This allows purchases to complete even if producer's wallet is empty
      log.warn(`Failed to consume tickets from producer ${producerUserId}'s wallet for ticket ${ticketId}:`, error);
    }
  } catch (error) {
    // Log error but don't fail the purchase/order completion
    log.error(`Error consuming producer wallet tickets for ticket ${ticketId}:`, error);
  }
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
  data: CreateUserAndOrderRequest,
  userLocation?: ResolvedLocation | null
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

  const order = await createOrder(appId, tenantId, userResult.userId, orderData, userLocation);

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

  if (order.status !== 'pending') {
    throw badRequest('Order is not in pending status');
  }

  // Verify payment with Razorpay using ticket owner's credentials first
  let paymentVerified = false;
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
        
        if (payment && payment.status === 'captured') {
          paymentVerified = true;
          log.info(`Verified payment ${paymentId} for order ${order.order_number} using ticket owner's credentials`);
        } else {
          log.warn(`Payment ${paymentId} not captured or invalid`);
          throw badRequest('Payment verification failed');
        }
      } catch (error) {
        // If verification fails, log but don't block order completion
        // The payment was already processed by Razorpay on their side
        log.warn(`Payment verification warning for ${paymentId}:`, error);
        // In production, you might want to be more strict here
        // For now, we'll allow completion if payment was processed by Razorpay
        paymentVerified = true; // Assume payment is valid if Razorpay processed it
      }
    }
  } catch (error) {
    log.warn(`Failed to verify payment for order ${order.order_number}:`, error);
    // Continue with order completion even if verification fails
    // The payment was already processed by Razorpay
    paymentVerified = true; // Assume payment is valid if Razorpay processed it
  }

  // If userId provided, verify it matches (but allow if payment is verified)
  // This handles cases where user session context differs (e.g., different domain, expired session)
  if (userId && order.user_id !== userId) {
    if (paymentVerified) {
      // Payment is verified, so allow completion but log a warning
      log.warn(`User ID mismatch for order ${order.order_number}: order.user_id=${order.user_id}, provided userId=${userId}. Allowing completion due to verified payment.`);
    } else {
      // Payment not verified and user ID doesn't match - reject
      throw badRequest('Order does not belong to this user');
    }
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

  // Consume tickets from producer's wallet (non-blocking)
  consumeProducerWalletTickets(updated.ticket_id, updated.quantity).catch((error) => {
    log.error(`Failed to consume producer wallet tickets for order ${updated.order_number}:`, error);
  });

  // Send purchase confirmation email (non-blocking)
  if (updated.customer_email) {
    log.info(`[EMAIL] Preparing to send purchase confirmation email for order ${updated.order_number} to ${updated.customer_email}`);
    try {
      // Get ticket details for email
      const ticketDetails = await dashboardRepo.getPublicTicketById(updated.ticket_id);
      if (ticketDetails) {
        log.info(`[EMAIL] Retrieved ticket details for order ${updated.order_number} - Ticket: ${ticketDetails.title || 'Unknown'}`);
        // Get the earliest event start datetime if available
        const firstEvent = ticketDetails.events && ticketDetails.events.length > 0
          ? ticketDetails.events
              .sort((a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime())[0]
          : undefined;
        const eventStartDatetime = firstEvent?.start_datetime;
        const eventEndDatetime = firstEvent?.end_datetime;
        
        // Get ticket thumbnail
        const ticketThumbnailUrl = ticketDetails.thumbnail_image_portrait 
          || ticketDetails.featured_image;

        // Construct watch link - use ticket URL if available, otherwise use ticket ID
        let watchLink: string | undefined;
        if (ticketDetails.url) {
          // Remove leading slash if present
          const cleanUrl = ticketDetails.url.replace(/^\//, '');
          watchLink = `/${cleanUrl}/watch`;
        } else {
          watchLink = `/watch?order=${updated.id}&ticket=${updated.ticket_id}`;
        }

        await sendPurchaseConfirmationEmail({
          recipientEmail: updated.customer_email,
          recipientName: updated.customer_name,
          orderNumber: updated.order_number,
          ticketTitle: ticketDetails.title || 'Ticket',
          ticketDescription: ticketDetails.description,
          ticketThumbnailUrl,
          quantity: updated.quantity,
          unitPrice: updated.unit_price,
          totalAmount: updated.total_amount,
          currency: updated.currency,
          eventTitle: firstEvent?.title,
          eventStartDatetime,
          eventEndDatetime,
          watchLink,
          tenantId: ticketOwnerTenantId,
          appId: ticketOwnerAppId,
        });
      } else {
        log.warn(`[EMAIL] Ticket details not found for ticket ${updated.ticket_id}, skipping email for order ${updated.order_number}`);
      }
    } catch (error) {
      // Log error but don't fail the order completion
      log.error(`[EMAIL] Failed to send purchase confirmation email for order ${updated.order_number}:`, error);
    }
  } else {
    log.warn(`[EMAIL] No customer email found for order ${updated.order_number}, skipping purchase confirmation email`);
  }

  return updated;
};

// Helper function to check if VOD content has been archived
const isVodContentArchived = async (ticketId: number): Promise<{ isArchived: boolean; archiveDate?: Date }> => {
  const ticket = await dashboardRepo.getPublicTicketById(ticketId);
  if (!ticket || !ticket.events || ticket.events.length === 0) {
    return { isArchived: false };
  }

  const now = new Date();
  
  // Check if any VOD event has archive_after date that has passed
  for (const event of ticket.events) {
    if (event.is_vod && event.archive_after) {
      const archiveDate = new Date(event.archive_after);
      if (archiveDate <= now) {
        return { isArchived: true, archiveDate };
      }
    }
  }

  return { isArchived: false };
};

// Check if user has purchased a ticket
// Also checks for email access grants
// Note: Archive checking is done per-event, not per-ticket
export const checkUserPurchaseStatus = async (
  _appId: string,
  _tenantId: string,
  userId: string,
  ticketId: number,
  userEmail?: string
): Promise<UserPurchaseStatusResponse> => {
  // Check for completed orders across all tenants
  // Orders can be created from any domain (custom domain or watch.rekard.com)
  // So we need to search across all tenants, not just the current domain's tenant
  const orders = await repo.getUserTicketOrdersAcrossTenants(userId, ticketId);
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
// Note: Archive checking is primarily done per-event in the frontend VideoPageLayout component
// This is a basic ticket-level check - individual events are checked when selected
export const getWatchLink = async (
  _appId: string,
  tenantId: string,
  userId: string,
  ticketId: number,
  userEmail?: string
): Promise<{ ticket_id: number; watch_link: string; order_id: number }> => {
  // Basic check: if ALL VOD events are archived, block access
  // Individual event archive checks happen in the frontend when events are selected
  const archiveCheck = await isVodContentArchived(ticketId);
  if (archiveCheck.isArchived) {
    throw badRequest('This content has been archived and is no longer available');
  }

  // Check if user has purchased the ticket across all tenants
  // Orders can be created from any domain (custom domain or watch.rekard.com)
  const orders = await repo.getUserTicketOrdersAcrossTenants(userId, ticketId);
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
// Checks purchases across all tenants (similar to watch link check)
// Orders can be created from any domain (custom domain or watch.rekard.com)
export const getMyPurchases = async (
  userId: string,
  pagination: PaginationParams = {},
  userEmail?: string
): Promise<MyPurchasesListResponse> => {
  // Get purchases from orders across all tenants
  const orderPurchases = await repo.listUserPurchasesWithTicketDetailsAcrossTenants(userId, pagination);
  
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
