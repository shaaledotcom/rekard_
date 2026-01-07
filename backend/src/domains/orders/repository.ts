// Orders repository - tenant-aware database operations using Drizzle ORM
import { eq, and, ilike, gte, lte, desc, asc, count, sum, inArray } from 'drizzle-orm';
import { db, orders, tickets, events, ticketEvents } from '../../db/index';
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
  OrderStatus,
} from './types';

const generateOrderNumber = (): string => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `ORD-${timestamp}-${random}`;
};

// Transform database row to API response format
const transformOrder = (order: typeof orders.$inferSelect): Order => {
  return {
    id: order.id,
    app_id: order.appId,
    tenant_id: order.tenantId,
    user_id: order.userId,
    ticket_id: order.ticketId ?? 0,
    event_id: order.eventId ?? undefined,
    order_number: order.orderNumber,
    status: order.status as OrderStatus,
    quantity: order.quantity,
    unit_price: order.unitPrice ? parseFloat(order.unitPrice) : 0,
    total_amount: order.totalAmount ? parseFloat(order.totalAmount) : 0,
    currency: order.currency ?? 'INR',
    payment_method: order.paymentMethod ?? undefined,
    external_payment_id: order.externalPaymentId ?? undefined,
    customer_email: order.customerEmail ?? undefined,
    customer_name: order.customerName ?? undefined,
    customer_phone: order.customerPhone ?? undefined,
    billing_address: order.billingAddress as Record<string, unknown>,
    metadata: order.metadata as Record<string, unknown>,
    created_at: order.createdAt,
    updated_at: order.updatedAt,
  };
};

export const createOrder = async (
  appId: string,
  tenantId: string,
  userId: string,
  data: CreateOrderRequest
): Promise<Order> => {
  const totalAmount = data.unit_price * data.quantity;
  
  const [order] = await db
    .insert(orders)
    .values({
      appId,
      tenantId,
      userId,
      ticketId: data.ticket_id,
      eventId: data.event_id,
      orderNumber: generateOrderNumber(),
      status: 'pending',
      quantity: data.quantity,
      unitPrice: data.unit_price.toString(),
      totalAmount: totalAmount.toString(),
      currency: data.currency || 'INR',
      paymentMethod: data.payment_method,
      externalPaymentId: data.external_payment_id,
      customerEmail: data.customer_email,
      customerName: data.customer_name,
      customerPhone: data.customer_phone,
      billingAddress: data.billing_address || {},
      metadata: data.metadata || {},
    })
    .returning();

  return transformOrder(order);
};

// Create a completed order directly (for free access grants)
// This bypasses the normal order flow and doesn't increment sold quantity
export const createCompletedOrder = async (
  appId: string,
  tenantId: string,
  userId: string,
  data: CreateOrderRequest
): Promise<Order> => {
  const totalAmount = data.unit_price * data.quantity;
  
  const [order] = await db
    .insert(orders)
    .values({
      appId,
      tenantId,
      userId,
      ticketId: data.ticket_id,
      eventId: data.event_id,
      orderNumber: generateOrderNumber(),
      status: 'completed',
      quantity: data.quantity,
      unitPrice: data.unit_price.toString(),
      totalAmount: totalAmount.toString(),
      currency: data.currency || 'INR',
      paymentMethod: data.payment_method || 'free_grant',
      externalPaymentId: data.external_payment_id,
      customerEmail: data.customer_email,
      customerName: data.customer_name,
      customerPhone: data.customer_phone,
      billingAddress: data.billing_address || {},
      metadata: { ...(data.metadata || {}), grant_type: 'free_access' },
    })
    .returning();

  return transformOrder(order);
};

export const getOrderById = async (
  appId: string,
  tenantId: string,
  orderId: number
): Promise<Order | null> => {
  const [order] = await db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.appId, appId),
        eq(orders.tenantId, tenantId),
        eq(orders.id, orderId)
      )
    )
    .limit(1);

  return order ? transformOrder(order) : null;
};

export const getOrderByNumber = async (
  orderNumber: string
): Promise<Order | null> => {
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.orderNumber, orderNumber))
    .limit(1);

  return order ? transformOrder(order) : null;
};

// Get order by ID only (for order completion - used when we need to find order regardless of appId/tenantId)
// This is safe because we verify the order belongs to the ticket owner before completing
export const getOrderByIdOnly = async (
  orderId: number
): Promise<Order | null> => {
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  return order ? transformOrder(order) : null;
};

export const getOrderByUserId = async (
  appId: string,
  tenantId: string,
  userId: string,
  orderId: number
): Promise<Order | null> => {
  const [order] = await db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.appId, appId),
        eq(orders.tenantId, tenantId),
        eq(orders.userId, userId),
        eq(orders.id, orderId)
      )
    )
    .limit(1);

  return order ? transformOrder(order) : null;
};

export const updateOrder = async (
  appId: string,
  tenantId: string,
  orderId: number,
  data: UpdateOrderRequest
): Promise<Order | null> => {
  const updates: Partial<typeof orders.$inferInsert> = { updatedAt: new Date() };

  if (data.status !== undefined) updates.status = data.status;
  if (data.payment_method !== undefined) updates.paymentMethod = data.payment_method;
  if (data.external_payment_id !== undefined) updates.externalPaymentId = data.external_payment_id;
  if (data.customer_email !== undefined) updates.customerEmail = data.customer_email;
  if (data.customer_name !== undefined) updates.customerName = data.customer_name;
  if (data.customer_phone !== undefined) updates.customerPhone = data.customer_phone;
  if (data.billing_address !== undefined) updates.billingAddress = data.billing_address;
  if (data.metadata !== undefined) updates.metadata = data.metadata;

  const [order] = await db
    .update(orders)
    .set(updates)
    .where(
      and(
        eq(orders.appId, appId),
        eq(orders.tenantId, tenantId),
        eq(orders.id, orderId)
      )
    )
    .returning();

  return order ? transformOrder(order) : null;
};

export const listOrders = async (
  appId: string,
  tenantId: string,
  filter: OrderFilter = {},
  pagination: PaginationParams = {},
  sort: SortParams = {}
): Promise<OrderListResponse> => {
  const page = Math.max(1, pagination.page || 1);
  const pageSize = Math.max(1, Math.min(100, pagination.page_size || 10));
  const offset = (page - 1) * pageSize;

  const conditions = [
    eq(orders.appId, appId),
    eq(orders.tenantId, tenantId),
  ];

  if (filter.status) {
    conditions.push(eq(orders.status, filter.status));
  }
  if (filter.customer_email) {
    conditions.push(ilike(orders.customerEmail, `%${filter.customer_email}%`));
  }
  if (filter.ticket_id) {
    conditions.push(eq(orders.ticketId, filter.ticket_id));
  }
  if (filter.event_id) {
    conditions.push(eq(orders.eventId, filter.event_id));
  }
  if (filter.start_date) {
    conditions.push(gte(orders.createdAt, filter.start_date));
  }
  if (filter.end_date) {
    conditions.push(lte(orders.createdAt, filter.end_date));
  }

  const [countResult] = await db
    .select({ count: count() })
    .from(orders)
    .where(and(...conditions));

  const total = countResult?.count || 0;

  const sortBy = sort.sort_by || 'created_at';
  const sortOrder = sort.sort_order || 'desc';
  
  const sortColumn = sortBy === 'created_at' ? orders.createdAt 
    : sortBy === 'total_amount' ? orders.totalAmount
    : sortBy === 'status' ? orders.status
    : orders.createdAt;

  const data = await db
    .select()
    .from(orders)
    .where(and(...conditions))
    .orderBy(sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn))
    .limit(pageSize)
    .offset(offset);

  return {
    data: data.map(transformOrder),
    total,
    page,
    page_size: pageSize,
    total_pages: Math.ceil(total / pageSize),
  };
};

export const listUserOrders = async (
  appId: string,
  tenantId: string,
  userId: string,
  pagination: PaginationParams = {},
  filter: { status?: OrderStatus } = {}
): Promise<OrderListResponse> => {
  const page = Math.max(1, pagination.page || 1);
  const pageSize = Math.max(1, Math.min(100, pagination.page_size || 10));
  const offset = (page - 1) * pageSize;

  const conditions = [
    eq(orders.appId, appId),
    eq(orders.tenantId, tenantId),
    eq(orders.userId, userId),
  ];

  if (filter.status) {
    conditions.push(eq(orders.status, filter.status));
  }

  const [countResult] = await db
    .select({ count: count() })
    .from(orders)
    .where(and(...conditions));

  const total = countResult?.count || 0;

  const data = await db
    .select()
    .from(orders)
    .where(and(...conditions))
    .orderBy(desc(orders.createdAt))
    .limit(pageSize)
    .offset(offset);

  return {
    data: data.map(transformOrder),
    total,
    page,
    page_size: pageSize,
    total_pages: Math.ceil(total / pageSize),
  };
};

export const getOrderWithDetails = async (
  appId: string,
  tenantId: string,
  orderId: number
): Promise<OrderWithDetails | null> => {
  const [order] = await db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.appId, appId),
        eq(orders.tenantId, tenantId),
        eq(orders.id, orderId)
      )
    )
    .limit(1);

  if (!order) return null;

  // Get ticket and event details
  let ticketTitle: string | undefined;
  let eventTitle: string | undefined;

  if (order.ticketId) {
    const [ticket] = await db
      .select({ title: tickets.title })
      .from(tickets)
      .where(eq(tickets.id, order.ticketId))
      .limit(1);
    ticketTitle = ticket?.title;
  }

  if (order.eventId) {
    const [event] = await db
      .select({ title: events.title })
      .from(events)
      .where(eq(events.id, order.eventId))
      .limit(1);
    eventTitle = event?.title;
  }

  return {
    ...transformOrder(order),
    ticket_title: ticketTitle,
    event_title: eventTitle,
  };
};

export const getOrderStats = async (
  appId: string,
  tenantId: string,
  startDate?: Date,
  endDate?: Date
): Promise<OrderStats> => {
  const conditions = [
    eq(orders.appId, appId),
    eq(orders.tenantId, tenantId),
  ];

  if (startDate) {
    conditions.push(gte(orders.createdAt, startDate));
  }
  if (endDate) {
    conditions.push(lte(orders.createdAt, endDate));
  }

  const [totalResult] = await db
    .select({
      count: count(),
      revenue: sum(orders.totalAmount),
    })
    .from(orders)
    .where(and(...conditions));

  const totalOrders = totalResult?.count || 0;
  const totalRevenue = parseFloat(totalResult?.revenue || '0');

  const statusCounts = await db
    .select({
      status: orders.status,
      count: count(),
    })
    .from(orders)
    .where(and(...conditions))
    .groupBy(orders.status);

  const ordersByStatus: Record<OrderStatus, number> = {
    pending: 0,
    completed: 0,
    cancelled: 0,
    refunded: 0,
  };

  for (const row of statusCounts) {
    if (row.status) {
      ordersByStatus[row.status as OrderStatus] = row.count;
    }
  }

  return {
    total_orders: totalOrders,
    total_revenue: totalRevenue,
    average_order_value: totalOrders > 0 ? totalRevenue / totalOrders : 0,
    orders_by_status: ordersByStatus,
  };
};

// Check if user has existing order for ticket
export const getUserTicketOrders = async (
  appId: string,
  tenantId: string,
  userId: string,
  ticketId: number
): Promise<Order[]> => {
  const data = await db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.appId, appId),
        eq(orders.tenantId, tenantId),
        eq(orders.userId, userId),
        eq(orders.ticketId, ticketId),
        inArray(orders.status, ['pending', 'completed'])
      )
    );

  return data.map(transformOrder);
};

// Get user's orders for a ticket across all tenants (for cross-domain purchase checking)
// Orders can be created from any domain (custom domain or watch.rekard.com)
export const getUserTicketOrdersAcrossTenants = async (
  userId: string,
  ticketId: number
): Promise<Order[]> => {
  const data = await db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.userId, userId),
        eq(orders.ticketId, ticketId),
        inArray(orders.status, ['pending', 'completed'])
      )
    );

  return data.map(transformOrder);
};

// Get user purchases with ticket details (for my-purchases endpoint)
export const listUserPurchasesWithTicketDetails = async (
  appId: string,
  tenantId: string,
  userId: string,
  pagination: PaginationParams = {}
) => {
  const page = Math.max(1, pagination.page || 1);
  const pageSize = Math.max(1, Math.min(100, pagination.page_size || 10));
  const offset = (page - 1) * pageSize;

  const conditions = [
    eq(orders.appId, appId),
    eq(orders.tenantId, tenantId),
    eq(orders.userId, userId),
    eq(orders.status, 'completed'),
  ];

  const [countResult] = await db
    .select({ count: count() })
    .from(orders)
    .where(and(...conditions));

  const total = countResult?.count || 0;

  const data = await db
    .select({
      orderId: orders.id,
      ticketId: orders.ticketId,
      purchasedAt: orders.createdAt,
      ticketTitle: tickets.title,
      ticketDescription: tickets.description,
      ticketUrl: tickets.url,
      ticketThumbnail: tickets.thumbnailImagePortrait,
    })
    .from(orders)
    .leftJoin(tickets, eq(orders.ticketId, tickets.id))
    .where(and(...conditions))
    .orderBy(desc(orders.createdAt))
    .limit(pageSize)
    .offset(offset);

  // Get the earliest event start datetime for each ticket via ticketEvents join table
  const ticketIds = data.map(d => d.ticketId).filter((id): id is number => id !== null);
  
  let eventStartDates: Record<number, string> = {};
  if (ticketIds.length > 0) {
    // Join ticketEvents with events to get start datetime for each ticket
    const eventData = await db
      .select({
        ticketId: ticketEvents.ticketId,
        startDatetime: events.startDatetime,
      })
      .from(ticketEvents)
      .innerJoin(events, eq(ticketEvents.eventId, events.id))
      .where(inArray(ticketEvents.ticketId, ticketIds))
      .orderBy(asc(events.startDatetime));

    // Get the earliest start datetime for each ticket
    for (const event of eventData) {
      if (event.ticketId && event.startDatetime && !eventStartDates[event.ticketId]) {
        eventStartDates[event.ticketId] = event.startDatetime.toISOString();
      }
    }
  }

  return {
    data: data.map(d => ({
      id: d.ticketId || 0,
      title: d.ticketTitle || '',
      description: d.ticketDescription || undefined,
      thumbnail_image_portrait: d.ticketThumbnail || undefined,
      url: d.ticketUrl || undefined,
      start_datetime: d.ticketId ? eventStartDates[d.ticketId] : undefined,
      ticket_id: d.ticketId || 0,
      order_id: d.orderId,
      purchased_at: d.purchasedAt,
    })),
    total,
    page,
    page_size: pageSize,
    total_pages: Math.ceil(total / pageSize),
  };
};
