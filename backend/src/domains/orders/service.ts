// Orders service - business logic
import * as repo from './repository.js';
import * as ticketsRepo from '../tickets/repository.js';
import * as dashboardRepo from '../dashboard/repository.js';
import { createUser } from '../auth/user.js';
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
  appId: string,
  tenantId: string,
  orderId: number,
  paymentId: string,
  userId?: string
): Promise<Order> => {
  const order = await repo.getOrderById(appId, tenantId, orderId);
  if (!order) {
    throw notFound('Order');
  }

  // If userId provided, verify it matches
  if (userId && order.user_id !== userId) {
    throw badRequest('Order does not belong to this user');
  }

  if (order.status !== 'pending') {
    throw badRequest('Order is not in pending status');
  }

  const updated = await repo.updateOrder(appId, tenantId, orderId, {
    status: 'completed',
    external_payment_id: paymentId,
  });

  log.info(`Completed order ${order.order_number} with payment ${paymentId}`);
  return updated!;
};

// Check if user has purchased a ticket
export const checkUserPurchaseStatus = async (
  appId: string,
  tenantId: string,
  userId: string,
  ticketId: number
): Promise<UserPurchaseStatusResponse> => {
  const orders = await repo.getUserTicketOrders(appId, tenantId, userId, ticketId);
  const completedOrder = orders.find(o => o.status === 'completed');

  return {
    ticket_id: ticketId,
    has_purchased: !!completedOrder,
    order_id: completedOrder?.id,
    order_number: completedOrder?.order_number,
  };
};

// Get watch link for a purchased ticket
export const getWatchLink = async (
  appId: string,
  tenantId: string,
  userId: string,
  ticketId: number
): Promise<{ ticket_id: number; watch_link: string; order_id: number }> => {
  // Check if user has purchased the ticket
  const orders = await repo.getUserTicketOrders(appId, tenantId, userId, ticketId);
  const completedOrder = orders.find(o => o.status === 'completed');

  if (!completedOrder) {
    throw badRequest('Ticket not purchased or order not completed');
  }

  // Generate watch link (simplified - in production would include secure token)
  const watchLink = `/watch?order=${completedOrder.id}&ticket=${ticketId}`;

  return {
    ticket_id: ticketId,
    watch_link: watchLink,
    order_id: completedOrder.id,
  };
};

// Get user's purchases (completed orders with ticket details)
export const getMyPurchases = async (
  appId: string,
  tenantId: string,
  userId: string,
  pagination: PaginationParams = {}
) => {
  return repo.listUserPurchasesWithTicketDetails(appId, tenantId, userId, pagination);
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
