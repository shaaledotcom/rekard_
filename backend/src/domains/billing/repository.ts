// Billing repository - tenant-aware database operations using Drizzle ORM
import { eq, and, or, ilike, gte, lte, desc, asc, count, sql } from 'drizzle-orm';
import { db, billingPlans, userWallets, walletTransactions, invoices, userSubscriptions, billingAuditLogs, ticketWalletAllocations, emailAccessGrants, tickets, orders, ticketBuyers } from '../../db/index';
import { SYSTEM_TENANT_ID, DEFAULT_APP_ID } from '../../domains/auth/constants.js';
import type {
  BillingPlan,
  PlanFeature,
  UserWallet,
  WalletTransaction,
  Invoice,
  InvoiceItem,
  UserSubscription,
  BillingAuditLog,
  TicketWalletAllocation,
  EmailAccessGrant,
  TicketBuyer,
  CreateBillingPlanRequest,
  UpdateBillingPlanRequest,
  BillingPlanFilter,
  WalletTransactionFilter,
  InvoiceFilter,
  AllocationFilter,
  PaginationParams,
  SortParams,
  ListResponse,
  SalesReportEntry,
  SalesReportFilter,
} from './types';

// Type converters
const toNumber = (val: unknown): number => {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') return parseFloat(val) || 0;
  return 0;
};

// Transform functions
const transformBillingPlan = (row: typeof billingPlans.$inferSelect): BillingPlan => ({
  id: row.id,
  app_id: row.appId,
  tenant_id: row.tenantId,
  name: row.name,
  description: row.description || undefined,
  price: toNumber(row.price),
  currency: row.currency || 'INR',
  billing_cycle: row.billingCycle || 'monthly',
  initial_tickets: row.initialTickets || 0,
  features: (row.features as PlanFeature[]) || [],
  is_active: row.isActive ?? true,
  is_public: row.isPublic ?? false,
  sort_order: row.sortOrder || 0,
  created_at: row.createdAt,
  updated_at: row.updatedAt,
});

const transformUserWallet = (row: typeof userWallets.$inferSelect): UserWallet => ({
  id: row.id,
  app_id: row.appId,
  tenant_id: row.tenantId,
  user_id: row.userId,
  ticket_balance: row.ticketBalance || 0,
  currency: row.currency || 'INR',
  created_at: row.createdAt,
  updated_at: row.updatedAt,
});

const transformWalletTransaction = (row: typeof walletTransactions.$inferSelect, userEmail?: string): WalletTransaction => ({
  id: row.id,
  app_id: row.appId,
  tenant_id: row.tenantId,
  user_id: row.userId,
  transaction_type: row.transactionType,
  amount: row.amount,
  currency: row.currency || 'INR',
  balance_before: row.balanceBefore,
  balance_after: row.balanceAfter,
  reference_type: row.referenceType || undefined,
  reference_id: row.referenceId || undefined,
  description: row.description || undefined,
  metadata: (row.metadata as Record<string, unknown>) || {},
  created_at: row.createdAt,
  user_email: userEmail,
});

const transformInvoice = (row: typeof invoices.$inferSelect): Invoice => ({
  id: row.id,
  app_id: row.appId,
  tenant_id: row.tenantId,
  user_id: row.userId,
  invoice_number: row.invoiceNumber,
  status: row.status || 'pending',
  subtotal: toNumber(row.subtotal),
  tax_amount: toNumber(row.taxAmount),
  total_amount: toNumber(row.totalAmount),
  currency: row.currency || 'INR',
  tax_rate: toNumber(row.taxRate),
  due_date: row.dueDate || undefined,
  paid_at: row.paidAt || undefined,
  payment_method: row.paymentMethod || undefined,
  external_payment_id: row.externalPaymentId || undefined,
  billing_address: (row.billingAddress as Record<string, unknown>) || {},
  items: (row.items as InvoiceItem[]) || [],
  notes: row.notes || undefined,
  created_at: row.createdAt,
  updated_at: row.updatedAt,
});

const transformUserSubscription = (row: typeof userSubscriptions.$inferSelect): UserSubscription => ({
  id: row.id,
  app_id: row.appId,
  tenant_id: row.tenantId,
  user_id: row.userId,
  plan_id: row.planId,
  status: row.status || 'active',
  current_period_start: row.currentPeriodStart,
  current_period_end: row.currentPeriodEnd,
  cancel_at_period_end: row.cancelAtPeriodEnd ?? false,
  cancelled_at: row.cancelledAt || undefined,
  trial_start: row.trialStart || undefined,
  trial_end: row.trialEnd || undefined,
  payment_method_id: row.paymentMethodId || undefined,
  external_subscription_id: row.externalSubscriptionId || undefined,
  created_at: row.createdAt,
  updated_at: row.updatedAt,
});

// Billing Plans
export const getBillingPlans = async (
  appId: string,
  tenantId: string,
  filter: BillingPlanFilter = {},
  pagination: PaginationParams = {},
  sort: SortParams = {}
): Promise<ListResponse<BillingPlan>> => {
  const page = Math.max(1, pagination.page || 1);
  const pageSize = Math.max(1, Math.min(100, pagination.page_size || 10));
  const offset = (page - 1) * pageSize;

  // Include both user's tenant plans AND system/default plans
  const tenantCondition = or(
    and(eq(billingPlans.appId, appId), eq(billingPlans.tenantId, tenantId)),
    and(eq(billingPlans.appId, DEFAULT_APP_ID), eq(billingPlans.tenantId, SYSTEM_TENANT_ID))
  );

  const conditions = [tenantCondition];

  if (filter.is_active !== undefined) {
    conditions.push(eq(billingPlans.isActive, filter.is_active));
  }
  if (filter.is_public !== undefined) {
    conditions.push(eq(billingPlans.isPublic, filter.is_public));
  }
  if (filter.search) {
    conditions.push(ilike(billingPlans.name, `%${filter.search}%`));
  }

  const [countResult] = await db
    .select({ count: count() })
    .from(billingPlans)
    .where(and(...conditions));

  const total = countResult?.count || 0;

  const sortBy = sort.sort_by || 'sort_order';
  const sortOrder = sort.sort_order || 'asc';
  const sortColumn = sortBy === 'sort_order' ? billingPlans.sortOrder 
    : sortBy === 'name' ? billingPlans.name
    : sortBy === 'price' ? billingPlans.price
    : billingPlans.sortOrder;

  const rows = await db
    .select()
    .from(billingPlans)
    .where(and(...conditions))
    .orderBy(sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn))
    .limit(pageSize)
    .offset(offset);

  return {
    data: rows.map(transformBillingPlan),
    total,
    page,
    page_size: pageSize,
    total_pages: Math.ceil(total / pageSize),
  };
};

export const getBillingPlanById = async (
  appId: string,
  tenantId: string,
  planId: number
): Promise<BillingPlan | null> => {
  // Look for plan in user's tenant OR system tenant
  const tenantCondition = or(
    and(eq(billingPlans.appId, appId), eq(billingPlans.tenantId, tenantId)),
    and(eq(billingPlans.appId, DEFAULT_APP_ID), eq(billingPlans.tenantId, SYSTEM_TENANT_ID))
  );

  const [row] = await db
    .select()
    .from(billingPlans)
    .where(
      and(
        tenantCondition,
        eq(billingPlans.id, planId)
      )
    )
    .limit(1);

  return row ? transformBillingPlan(row) : null;
};

export const createBillingPlan = async (
  appId: string,
  tenantId: string,
  data: CreateBillingPlanRequest
): Promise<BillingPlan> => {
  const [row] = await db
    .insert(billingPlans)
    .values({
      appId,
      tenantId,
      name: data.name,
      description: data.description,
      price: data.price.toString(),
      currency: data.currency || 'INR',
      billingCycle: data.billing_cycle || 'monthly',
      initialTickets: data.initial_tickets,
      features: data.features || [],
      isActive: data.is_active ?? true,
      isPublic: data.is_public ?? true,
      sortOrder: data.sort_order ?? 0,
    })
    .returning();

  return transformBillingPlan(row);
};

export const updateBillingPlan = async (
  appId: string,
  tenantId: string,
  planId: number,
  data: UpdateBillingPlanRequest
): Promise<BillingPlan | null> => {
  const updates: Partial<typeof billingPlans.$inferInsert> = { updatedAt: new Date() };

  if (data.name !== undefined) updates.name = data.name;
  if (data.description !== undefined) updates.description = data.description;
  if (data.price !== undefined) updates.price = data.price.toString();
  if (data.currency !== undefined) updates.currency = data.currency;
  if (data.billing_cycle !== undefined) updates.billingCycle = data.billing_cycle;
  if (data.initial_tickets !== undefined) updates.initialTickets = data.initial_tickets;
  if (data.features !== undefined) updates.features = data.features;
  if (data.is_active !== undefined) updates.isActive = data.is_active;
  if (data.is_public !== undefined) updates.isPublic = data.is_public;
  if (data.sort_order !== undefined) updates.sortOrder = data.sort_order;

  const [row] = await db
    .update(billingPlans)
    .set(updates)
    .where(
      and(
        eq(billingPlans.appId, appId),
        eq(billingPlans.tenantId, tenantId),
        eq(billingPlans.id, planId)
      )
    )
    .returning();

  return row ? transformBillingPlan(row) : null;
};

export const deleteBillingPlan = async (
  appId: string,
  tenantId: string,
  planId: number
): Promise<boolean> => {
  const result = await db
    .delete(billingPlans)
    .where(
      and(
        eq(billingPlans.appId, appId),
        eq(billingPlans.tenantId, tenantId),
        eq(billingPlans.id, planId)
      )
    )
    .returning({ id: billingPlans.id });

  return result.length > 0;
};

// User Wallets
export const getOrCreateUserWallet = async (
  appId: string,
  tenantId: string,
  userId: string
): Promise<UserWallet> => {
  const [existing] = await db
    .select()
    .from(userWallets)
    .where(
      and(
        eq(userWallets.appId, appId),
        eq(userWallets.tenantId, tenantId),
        eq(userWallets.userId, userId)
      )
    )
    .limit(1);

  if (existing) {
    return transformUserWallet(existing);
  }

  const [row] = await db
    .insert(userWallets)
    .values({
      appId,
      tenantId,
      userId,
      ticketBalance: 0,
      currency: 'INR',
    })
    .returning();

  return transformUserWallet(row);
};

export const updateWalletBalance = async (
  appId: string,
  tenantId: string,
  userId: string,
  amount: number,
  transactionType: string,
  referenceType?: string,
  referenceId?: string,
  description?: string,
  metadata: Record<string, unknown> = {}
): Promise<WalletTransaction> => {
  return await db.transaction(async (tx) => {
    const [wallet] = await tx
      .select()
      .from(userWallets)
      .where(
        and(
          eq(userWallets.appId, appId),
          eq(userWallets.tenantId, tenantId),
          eq(userWallets.userId, userId)
        )
      )
      .limit(1);

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    const balanceBefore = wallet.ticketBalance || 0;
    const balanceAfter = balanceBefore + amount;

    if (balanceAfter < 0) {
      throw new Error('Insufficient balance');
    }

    await tx
      .update(userWallets)
      .set({
        ticketBalance: balanceAfter,
        updatedAt: new Date(),
      })
      .where(eq(userWallets.id, wallet.id));

    const [transaction] = await tx
      .insert(walletTransactions)
      .values({
        appId,
        tenantId,
        userId,
        transactionType,
        amount,
        currency: wallet.currency || 'INR',
        balanceBefore,
        balanceAfter,
        referenceType,
        referenceId,
        description,
        metadata,
      })
      .returning();

    return transformWalletTransaction(transaction);
  });
};

export const getWalletTransactions = async (
  _appId: string, // Not used - we filter by tenantId instead for custom domain compatibility
  tenantId: string,
  filter: WalletTransactionFilter = {},
  pagination: PaginationParams = {}
): Promise<ListResponse<WalletTransaction>> => {
  const page = Math.max(1, pagination.page || 1);
  const pageSize = Math.max(1, Math.min(100, pagination.page_size || 10));

  // Filter wallet transactions by tenantId (primary identifier)
  // For ticket purchase transactions, we'll also filter by ticket ownership in the join
  // to ensure consistency with sales report
  // Note: We filter by tenantId primarily because:
  // - For custom domains, appId might be UUID (different from 'public')
  // - Transactions might have been created with different appIds over time
  // - tenantId is the definitive identifier for ownership
  const conditions = [
    // All transactions must belong to this tenant
    eq(walletTransactions.tenantId, tenantId),
  ];

  if (filter.user_id) {
    conditions.push(eq(walletTransactions.userId, filter.user_id));
  }
  if (filter.transaction_type) {
    conditions.push(eq(walletTransactions.transactionType, filter.transaction_type));
  }
  if (filter.start_date) {
    conditions.push(gte(walletTransactions.createdAt, filter.start_date));
  }
  if (filter.end_date) {
    conditions.push(lte(walletTransactions.createdAt, filter.end_date));
  }

  // Fetch all transactions for tenant, then filter in code
  // Note: We don't use the count query since we filter in code and need accurate filtered count
  const rows = await db
    .select({
      transaction: walletTransactions,
      orderEmail: orders.customerEmail,
      buyerEmail: ticketBuyers.buyerEmail,
      ticketTenantId: tickets.tenantId,
      orderId: orders.id,
      orderStatus: orders.status,
    })
    .from(walletTransactions)
    .leftJoin(
      tickets,
      and(
        sql`${walletTransactions.referenceType} = 'ticket_purchase'`,
        sql`${walletTransactions.referenceId} IS NOT NULL AND ${walletTransactions.referenceId} != ''`,
        // Match ticket ID if referenceId is numeric
        sql`${tickets.id} = CASE WHEN ${walletTransactions.referenceId} ~ '^[0-9]+$' THEN CAST(${walletTransactions.referenceId} AS INTEGER) ELSE NULL END`
      )
    )
    .leftJoin(
      orders,
      and(
        // Only try to match orders for ticket_purchase transactions or when referenceType suggests it's an order
        // This prevents matching subscription IDs or other non-order referenceIds to orders
        sql`(
          ${walletTransactions.referenceType} = 'ticket_purchase' 
          OR ${walletTransactions.referenceType} IS NULL
        )`,
        // Only try to match orders if referenceId is not null and not empty
        sql`${walletTransactions.referenceId} IS NOT NULL AND ${walletTransactions.referenceId} != ''`,
        // Try to match by order ID first, then by ticket ID
        or(
          // Match by order ID if referenceId is numeric
          sql`${orders.id} = CASE WHEN ${walletTransactions.referenceId} ~ '^[0-9]+$' THEN CAST(${walletTransactions.referenceId} AS INTEGER) ELSE NULL END`,
          // Match by ticket ID if referenceId is numeric
          sql`${orders.ticketId} = CASE WHEN ${walletTransactions.referenceId} ~ '^[0-9]+$' THEN CAST(${walletTransactions.referenceId} AS INTEGER) ELSE NULL END`
        ),
        // Orders are created with appId='public' for viewer purchases,
        // but wallet transactions might have a different appId. Query for both.
        or(eq(orders.appId, walletTransactions.appId), eq(orders.appId, 'public'))
      )
    )
    .leftJoin(
      ticketBuyers,
      and(
        sql`${walletTransactions.referenceId} IS NOT NULL AND ${walletTransactions.referenceId} != ''`,
        // Try to match ticketId when referenceId is numeric (using safe cast)
        sql`${ticketBuyers.ticketId} = CASE WHEN ${walletTransactions.referenceId} ~ '^[0-9]+$' THEN CAST(${walletTransactions.referenceId} AS INTEGER) ELSE NULL END`,
        // Ticket buyers might have appId='public' or match wallet transaction's appId
        or(eq(ticketBuyers.appId, walletTransactions.appId), eq(ticketBuyers.appId, 'public')),
        eq(ticketBuyers.tenantId, walletTransactions.tenantId)
      )
    )
    .where(and(...conditions))
    .orderBy(desc(walletTransactions.createdAt));

  // Deduplicate transactions (in case join matches multiple orders)
  const transactionMap = new Map<number, { 
    transaction: typeof walletTransactions.$inferSelect; 
    email?: string;
    ticketTenantId?: string | null;
    orderId?: number | null;
    orderStatus?: string | null;
  }>();
  
  rows.forEach((row) => {
    const txId = row.transaction.id;
    if (!transactionMap.has(txId)) {
      const userEmail = row.orderEmail || row.buyerEmail || undefined;
      transactionMap.set(txId, { 
        transaction: row.transaction, 
        email: userEmail,
        ticketTenantId: row.ticketTenantId,
        orderId: row.orderId,
        orderStatus: row.orderStatus,
      });
    } else {
      const existing = transactionMap.get(txId)!;
      // Prefer completed orders over pending orders for ticket_purchase transactions
      if (row.transaction.referenceType === 'ticket_purchase') {
        const currentIsCompleted = existing.orderStatus === 'completed';
        const newIsCompleted = row.orderStatus === 'completed';
        
        // If new row has completed order and current doesn't, replace it
        if (newIsCompleted && !currentIsCompleted) {
          existing.orderId = row.orderId;
          existing.orderStatus = row.orderStatus;
          if (row.orderEmail || row.buyerEmail) {
            existing.email = row.orderEmail || row.buyerEmail || undefined;
          }
        }
        // If both are completed or both are pending, prefer the one with email
        else if (newIsCompleted === currentIsCompleted) {
          if (!existing.email && (row.orderEmail || row.buyerEmail)) {
            existing.email = row.orderEmail || row.buyerEmail || undefined;
          }
        }
      } else {
        // For non-ticket_purchase transactions, just prefer non-null email
        if (!existing.email && (row.orderEmail || row.buyerEmail)) {
          existing.email = row.orderEmail || row.buyerEmail || undefined;
        }
      }
    }
  });

  // Filter transactions in code
  const filteredTransactions = Array.from(transactionMap.values()).filter(({ transaction, ticketTenantId, orderId, orderStatus }) => {
    const refType = transaction.referenceType;
    
    // Include all non-ticket_purchase transactions
    if (!refType || refType !== 'ticket_purchase') {
      return true;
    }
    
    // For ticket_purchase transactions, filter by ticket ownership and completed order
    if (refType === 'ticket_purchase') {
      const hasTicket = ticketTenantId !== null && ticketTenantId === tenantId;
      const hasCompletedOrder = orderId !== null && orderStatus === 'completed';
      return hasTicket && hasCompletedOrder;
    }
    
    return false;
  });

  // Apply pagination after filtering
  const filteredTotal = filteredTransactions.length;
  const filteredOffset = (page - 1) * pageSize;
  const paginatedTransactions = filteredTransactions.slice(filteredOffset, filteredOffset + pageSize);

  return {
    data: paginatedTransactions.map(({ transaction, email }) => {
      return transformWalletTransaction(transaction, email);
    }),
    total: filteredTotal, // Use filtered count, not raw count
    page,
    page_size: pageSize,
    total_pages: Math.ceil(filteredTotal / pageSize),
  };
};

// Invoices
export const createInvoice = async (
  appId: string,
  tenantId: string,
  userId: string,
  invoiceNumber: string,
  subtotal: number,
  taxAmount: number,
  totalAmount: number,
  currency: string,
  taxRate: number,
  items: InvoiceItem[],
  options: {
    dueDate?: Date;
    paymentMethod?: string;
    externalPaymentId?: string;
    billingAddress?: Record<string, unknown>;
    notes?: string;
  } = {}
): Promise<Invoice> => {
  const [invoice] = await db
    .insert(invoices)
    .values({
      appId,
      tenantId,
      userId,
      invoiceNumber,
      status: 'draft',
      subtotal: subtotal.toString(),
      taxAmount: taxAmount.toString(),
      totalAmount: totalAmount.toString(),
      currency,
      taxRate: taxRate.toString(),
      dueDate: options.dueDate,
      paymentMethod: options.paymentMethod,
      externalPaymentId: options.externalPaymentId,
      billingAddress: options.billingAddress || {},
      items,
      notes: options.notes,
    })
    .returning();

  return transformInvoice(invoice);
};

export const getInvoices = async (
  appId: string,
  tenantId: string,
  filter: InvoiceFilter = {},
  pagination: PaginationParams = {}
): Promise<ListResponse<Invoice>> => {
  const page = Math.max(1, pagination.page || 1);
  const pageSize = Math.max(1, Math.min(100, pagination.page_size || 10));
  const offset = (page - 1) * pageSize;

  const conditions = [
    eq(invoices.appId, appId),
    eq(invoices.tenantId, tenantId),
  ];

  if (filter.user_id) {
    conditions.push(eq(invoices.userId, filter.user_id));
  }
  if (filter.status) {
    conditions.push(eq(invoices.status, filter.status));
  }
  if (filter.start_date) {
    conditions.push(gte(invoices.createdAt, filter.start_date));
  }
  if (filter.end_date) {
    conditions.push(lte(invoices.createdAt, filter.end_date));
  }

  const [countResult] = await db
    .select({ count: count() })
    .from(invoices)
    .where(and(...conditions));

  const total = countResult?.count || 0;

  const rows = await db
    .select()
    .from(invoices)
    .where(and(...conditions))
    .orderBy(desc(invoices.createdAt))
    .limit(pageSize)
    .offset(offset);

  return {
    data: rows.map(transformInvoice),
    total,
    page,
    page_size: pageSize,
    total_pages: Math.ceil(total / pageSize),
  };
};

export const getInvoiceById = async (
  appId: string,
  tenantId: string,
  invoiceId: number
): Promise<Invoice | null> => {
  const [row] = await db
    .select()
    .from(invoices)
    .where(
      and(
        eq(invoices.appId, appId),
        eq(invoices.tenantId, tenantId),
        eq(invoices.id, invoiceId)
      )
    )
    .limit(1);

  return row ? transformInvoice(row) : null;
};

export const updateInvoiceStatus = async (
  appId: string,
  tenantId: string,
  invoiceNumber: string,
  status: string,
  paidAt?: Date,
  externalPaymentId?: string
): Promise<boolean> => {
  const result = await db
    .update(invoices)
    .set({
      status,
      paidAt,
      externalPaymentId,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(invoices.appId, appId),
        eq(invoices.tenantId, tenantId),
        eq(invoices.invoiceNumber, invoiceNumber)
      )
    )
    .returning({ id: invoices.id });

  return result.length > 0;
};

// Subscriptions
export const getUserSubscription = async (
  appId: string,
  tenantId: string,
  userId: string
): Promise<UserSubscription | null> => {
  const [row] = await db
    .select()
    .from(userSubscriptions)
    .where(
      and(
        eq(userSubscriptions.appId, appId),
        eq(userSubscriptions.tenantId, tenantId),
        eq(userSubscriptions.userId, userId),
        eq(userSubscriptions.status, 'active')
      )
    )
    .limit(1);

  return row ? transformUserSubscription(row) : null;
};

export const createSubscription = async (
  appId: string,
  tenantId: string,
  userId: string,
  planId: number,
  periodStart: Date,
  periodEnd: Date,
  options: {
    paymentMethodId?: string;
    externalSubscriptionId?: string;
    trialStart?: Date;
    trialEnd?: Date;
  } = {}
): Promise<UserSubscription> => {
  const [row] = await db
    .insert(userSubscriptions)
    .values({
      appId,
      tenantId,
      userId,
      planId,
      status: 'active',
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
      paymentMethodId: options.paymentMethodId,
      externalSubscriptionId: options.externalSubscriptionId,
      trialStart: options.trialStart,
      trialEnd: options.trialEnd,
    })
    .returning();

  return transformUserSubscription(row);
};

export const cancelSubscription = async (
  appId: string,
  tenantId: string,
  userId: string,
  cancelAtPeriodEnd: boolean = true
): Promise<boolean> => {
  const updates: Partial<typeof userSubscriptions.$inferInsert> = {
    cancelAtPeriodEnd,
    updatedAt: new Date(),
  };

  if (!cancelAtPeriodEnd) {
    updates.status = 'cancelled';
    updates.cancelledAt = new Date();
  }

  const result = await db
    .update(userSubscriptions)
    .set(updates)
    .where(
      and(
        eq(userSubscriptions.appId, appId),
        eq(userSubscriptions.tenantId, tenantId),
        eq(userSubscriptions.userId, userId),
        eq(userSubscriptions.status, 'active')
      )
    )
    .returning({ id: userSubscriptions.id });

  return result.length > 0;
};

// Audit logs
export const createAuditLog = async (
  appId: string,
  tenantId: string,
  userId: string,
  action: string,
  resourceType: string,
  resourceId: string | null,
  oldValue: Record<string, unknown>,
  newValue: Record<string, unknown>,
  performedBy: string,
  ipAddress?: string,
  userAgent?: string
): Promise<BillingAuditLog> => {
  const [auditLog] = await db
    .insert(billingAuditLogs)
    .values({
      appId,
      tenantId,
      userId,
      action,
      entityType: resourceType,
      entityId: resourceId ? parseInt(resourceId, 10) || null : null,
      details: { old_value: oldValue, new_value: newValue, performed_by: performedBy, ip_address: ipAddress, user_agent: userAgent },
    })
    .returning();

  // Map to expected type
  const details = (auditLog.details as Record<string, unknown>) || {};
  return {
    id: auditLog.id,
    app_id: auditLog.appId,
    tenant_id: auditLog.tenantId,
    user_id: auditLog.userId,
    action: auditLog.action,
    resource_type: auditLog.entityType || '',
    resource_id: auditLog.entityId ? String(auditLog.entityId) : undefined,
    old_value: (details.old_value as Record<string, unknown>) || {},
    new_value: (details.new_value as Record<string, unknown>) || {},
    performed_by: (details.performed_by as string) || '',
    ip_address: details.ip_address as string | undefined,
    user_agent: details.user_agent as string | undefined,
    created_at: auditLog.createdAt,
  };
};

// Transform allocation to expected type
const transformAllocation = (row: typeof ticketWalletAllocations.$inferSelect): TicketWalletAllocation => ({
  id: row.id,
  app_id: row.appId,
  tenant_id: row.tenantId,
  user_id: row.userId,
  ticket_id: row.ticketId,
  allocated_quantity: row.quantity,
  consumed_quantity: row.usedAt ? row.quantity : 0,
  available_quantity: row.usedAt ? 0 : row.quantity,
  status: (row.status as 'active' | 'released' | 'consumed') || 'active',
  created_at: row.allocatedAt,
  updated_at: row.usedAt ?? row.allocatedAt,
});

// Ticket Wallet Allocations
export const createAllocation = async (
  appId: string,
  tenantId: string,
  userId: string,
  ticketId: number,
  quantity: number
): Promise<TicketWalletAllocation> => {
  const [allocation] = await db
    .insert(ticketWalletAllocations)
    .values({
      appId,
      tenantId,
      userId,
      ticketId,
      quantity,
      status: 'active',
    })
    .returning();

  return transformAllocation(allocation);
};

export const getAllocations = async (
  appId: string,
  tenantId: string,
  filter: AllocationFilter = {},
  pagination: PaginationParams = {}
): Promise<ListResponse<TicketWalletAllocation>> => {
  const page = Math.max(1, pagination.page || 1);
  const pageSize = Math.max(1, Math.min(100, pagination.page_size || 10));
  const offset = (page - 1) * pageSize;

  const conditions = [
    eq(ticketWalletAllocations.appId, appId),
    eq(ticketWalletAllocations.tenantId, tenantId),
  ];

  if (filter.user_id) {
    conditions.push(eq(ticketWalletAllocations.userId, filter.user_id));
  }
  if (filter.ticket_id) {
    conditions.push(eq(ticketWalletAllocations.ticketId, filter.ticket_id));
  }
  if (filter.status) {
    conditions.push(eq(ticketWalletAllocations.status, filter.status));
  }

  const [countResult] = await db
    .select({ count: count() })
    .from(ticketWalletAllocations)
    .where(and(...conditions));

  const total = countResult?.count || 0;

  const data = await db
    .select()
    .from(ticketWalletAllocations)
    .where(and(...conditions))
    .orderBy(desc(ticketWalletAllocations.allocatedAt))
    .limit(pageSize)
    .offset(offset);

  return {
    data: data.map(transformAllocation),
    total,
    page,
    page_size: pageSize,
    total_pages: Math.ceil(total / pageSize),
  };
};

export const getAllocationByTicket = async (
  appId: string,
  tenantId: string,
  userId: string,
  ticketId: number
): Promise<TicketWalletAllocation | null> => {
  const [allocation] = await db
    .select()
    .from(ticketWalletAllocations)
    .where(
      and(
        eq(ticketWalletAllocations.appId, appId),
        eq(ticketWalletAllocations.tenantId, tenantId),
        eq(ticketWalletAllocations.userId, userId),
        eq(ticketWalletAllocations.ticketId, ticketId),
        eq(ticketWalletAllocations.status, 'active')
      )
    )
    .limit(1);

  return allocation ? transformAllocation(allocation) : null;
};

export const updateAllocation = async (
  appId: string,
  tenantId: string,
  allocationId: number,
  updates: Partial<{ status: string; allocated_quantity: number; available_quantity: number }>
): Promise<TicketWalletAllocation | null> => {
  const dbUpdates: Partial<typeof ticketWalletAllocations.$inferInsert> = {};
  if (updates.status) dbUpdates.status = updates.status;
  if (updates.allocated_quantity !== undefined) dbUpdates.quantity = updates.allocated_quantity;

  const [allocation] = await db
    .update(ticketWalletAllocations)
    .set(dbUpdates)
    .where(
      and(
        eq(ticketWalletAllocations.appId, appId),
        eq(ticketWalletAllocations.tenantId, tenantId),
        eq(ticketWalletAllocations.id, allocationId)
      )
    )
    .returning();

  return allocation ? transformAllocation(allocation) : null;
};

export const releaseAllocation = async (
  appId: string,
  tenantId: string,
  userId: string,
  ticketId: number
): Promise<{ released_quantity: number } | null> => {
  const allocation = await getAllocationByTicket(appId, tenantId, userId, ticketId);
  if (!allocation) return null;

  const releasedQuantity = allocation.allocated_quantity;

  await db
    .update(ticketWalletAllocations)
    .set({ status: 'released' })
    .where(eq(ticketWalletAllocations.id, allocation.id));

  return { released_quantity: releasedQuantity };
};

// Email Access Grants
export const createEmailAccessGrant = async (
  appId: string,
  tenantId: string,
  userId: string,
  email: string,
  ticketId: number
): Promise<EmailAccessGrant> => {
  const [grant] = await db
    .insert(emailAccessGrants)
    .values({
      appId,
      tenantId,
      userId,
      email: email.toLowerCase(),
      ticketId,
      status: 'active',
      grantedAt: new Date(),
    })
    .returning();

  return grant as unknown as EmailAccessGrant;
};

export const getEmailAccessGrant = async (
  appId: string,
  tenantId: string,
  email: string,
  ticketId: number
): Promise<EmailAccessGrant | null> => {
  const [grant] = await db
    .select()
    .from(emailAccessGrants)
    .where(
      and(
        eq(emailAccessGrants.appId, appId),
        eq(emailAccessGrants.tenantId, tenantId),
        eq(emailAccessGrants.email, email.toLowerCase()),
        eq(emailAccessGrants.ticketId, ticketId),
        eq(emailAccessGrants.status, 'active')
      )
    )
    .limit(1);

  return grant ? (grant as unknown as EmailAccessGrant) : null;
};

export const getEmailAccessStatuses = async (
  appId: string,
  tenantId: string,
  emails: string[],
  ticketId: number
): Promise<Array<{ email: string; has_access: boolean; quantity: number }>> => {
  const normalizedEmails = emails.map(e => e.toLowerCase().trim());
  
  const grants = await db
    .select()
    .from(emailAccessGrants)
    .where(
      and(
        eq(emailAccessGrants.appId, appId),
        eq(emailAccessGrants.tenantId, tenantId),
        eq(emailAccessGrants.ticketId, ticketId),
        eq(emailAccessGrants.status, 'active'),
        sql`${emailAccessGrants.email} = ANY(${normalizedEmails})`
      )
    );

  const grantMap = new Map(grants.map(g => [g.email, g]));

  return normalizedEmails.map(email => {
    const grant = grantMap.get(email);
    return {
      email,
      has_access: !!grant,
      quantity: 1, // Default quantity
    };
  });
};

// Ticket Buyers
export const getTicketBuyers = async (
  appId: string,
  tenantId: string,
  _producerUserId: string,
  limit: number = 50,
  paginationToken?: string
): Promise<{ buyers: TicketBuyer[]; next_pagination_token: string | null }> => {
  const conditions = [
    // Orders are created with appId='public' for viewer purchases,
    // but producer might have a different appId. Query for both.
    or(eq(orders.appId, appId), eq(orders.appId, 'public')),
    eq(orders.tenantId, tenantId),
    eq(orders.status, 'completed'),
  ];

  if (paginationToken) {
    const decoded = Buffer.from(paginationToken, 'base64').toString('utf8');
    conditions.push(sql`${orders.createdAt} < ${new Date(decoded)}`);
  }

  const results = await db
    .select({
      userId: orders.userId,
      email: orders.customerEmail,
      name: orders.customerName,
      phone: orders.customerPhone,
      ticketId: orders.ticketId,
      ticketTitle: tickets.title,
      quantity: orders.quantity,
      totalAmount: orders.totalAmount,
      currency: orders.currency,
      purchasedAt: orders.createdAt,
      orderNumber: orders.orderNumber,
    })
    .from(orders)
    .leftJoin(tickets, eq(orders.ticketId, tickets.id))
    .where(and(...conditions))
    .orderBy(desc(orders.createdAt))
    .limit(limit + 1);

  let nextToken: string | null = null;
  if (results.length > limit) {
    const lastItem = results[limit - 1];
    nextToken = Buffer.from(lastItem.purchasedAt.toISOString()).toString('base64');
    results.pop();
  }

  return {
    buyers: results.map(r => ({
      user_id: r.userId,
      email: r.email || '',
      name: r.name || '',
      phone: r.phone || '',
      ticket_id: r.ticketId || 0,
      ticket_title: r.ticketTitle || '',
      quantity: r.quantity,
      total_amount: toNumber(r.totalAmount),
      currency: r.currency || 'INR',
      purchased_at: r.purchasedAt,
      order_number: r.orderNumber,
    })) as TicketBuyer[],
    next_pagination_token: nextToken,
  };
};

// Sales Report - combines completed orders and email access grants
export const getSalesReport = async (
  _appId: string, // Not used - we filter by ticket ownership instead
  tenantId: string,
  filter: SalesReportFilter = {},
  pagination: PaginationParams = {},
  sort: SortParams = {}
): Promise<ListResponse<SalesReportEntry>> => {
  const page = Math.max(1, pagination.page || 1);
  const pageSize = Math.max(1, Math.min(100, pagination.page_size || 20));
  const offset = (page - 1) * pageSize;

  const entries: SalesReportEntry[] = [];

  // Get completed orders (purchased)
  if (!filter.type || filter.type === 'purchased' || filter.type === 'all') {
    const orderConditions = [
      // Ensure ticket belongs to the producer by filtering by tenantId
      // This is the most reliable way to identify producer's tickets
      // We don't filter by ticket.appId because:
      // - Tickets might have 'public' appId or producer's appId
      // - Producer's appId might have changed over time
      // - TenantId is the definitive identifier for ticket ownership
      eq(tickets.tenantId, tenantId),
      // Note: We don't filter by order.appId or order.tenantId here because:
      // 1. Orders are always created with appId='public' for viewer purchases
      // 2. Old orders (created before fix) might have wrong order.tenantId
      // 3. New orders (created after fix) will have correct order.tenantId
      // 4. By filtering by ticket.tenantId only, we catch ALL orders for producer's tickets
      //    regardless of what order.appId/tenantId or ticket.appId was set to
      eq(orders.status, 'completed'),
      // Ensure order has a ticketId (should always be true for ticket purchases)
      sql`${orders.ticketId} IS NOT NULL`,
    ];

    if (filter.ticket_id) {
      orderConditions.push(eq(orders.ticketId, filter.ticket_id));
    }
    if (filter.user_email) {
      orderConditions.push(ilike(orders.customerEmail, `%${filter.user_email}%`));
    }
    if (filter.start_date) {
      orderConditions.push(gte(orders.createdAt, filter.start_date));
    }
    if (filter.end_date) {
      orderConditions.push(lte(orders.createdAt, filter.end_date));
    }

    const orderRows = await db
      .select({
        order: orders,
        ticketTitle: tickets.title,
      })
      .from(orders)
      .innerJoin(tickets, eq(orders.ticketId, tickets.id))
      .where(and(...orderConditions))
      .orderBy(desc(orders.createdAt));

    orderRows.forEach((row) => {
      if (row.order.ticketId) {
        entries.push({
          id: `order-${row.order.id}`,
          type: 'purchased',
          date: row.order.createdAt,
          user_email: row.order.customerEmail || '',
          ticket_id: row.order.ticketId,
          ticket_title: row.ticketTitle || '',
          quantity: row.order.quantity,
          amount: toNumber(row.order.totalAmount),
          currency: row.order.currency || 'INR',
          order_number: row.order.orderNumber,
        });
      }
    });
  }

  // Get email access grants (granted)
  if (!filter.type || filter.type === 'granted' || filter.type === 'all') {
    const grantConditions = [
      // Ensure ticket belongs to the producer by filtering by tenantId
      // This is the most reliable way to identify producer's tickets
      // We don't filter by grant.appId or grant.tenantId because:
      // - Grants might have been created with different appId/tenantId values
      // - By filtering by ticket.tenantId only, we catch ALL grants for producer's tickets
      //   regardless of what grant.appId/tenantId was set to
      eq(tickets.tenantId, tenantId),
      eq(emailAccessGrants.status, 'active'),
      // Ensure grant has a ticketId (should always be true for ticket grants)
      sql`${emailAccessGrants.ticketId} IS NOT NULL`,
    ];

    if (filter.ticket_id) {
      grantConditions.push(eq(emailAccessGrants.ticketId, filter.ticket_id));
    }
    if (filter.user_email) {
      grantConditions.push(ilike(emailAccessGrants.email, `%${filter.user_email}%`));
    }
    if (filter.start_date) {
      grantConditions.push(gte(emailAccessGrants.grantedAt, filter.start_date));
    }
    if (filter.end_date) {
      grantConditions.push(lte(emailAccessGrants.grantedAt, filter.end_date));
    }

    const grantRows = await db
      .select({
        grant: emailAccessGrants,
        ticketTitle: tickets.title,
      })
      .from(emailAccessGrants)
      .innerJoin(tickets, eq(emailAccessGrants.ticketId, tickets.id))
      .where(and(...grantConditions))
      .orderBy(desc(emailAccessGrants.grantedAt));

    grantRows.forEach((row) => {
      entries.push({
        id: `grant-${row.grant.id}`,
        type: 'granted',
        date: row.grant.grantedAt,
        user_email: row.grant.email,
        ticket_id: row.grant.ticketId,
        ticket_title: row.ticketTitle || '',
        quantity: 1, // Grants are typically 1 per email
        currency: 'INR', // Grants don't have currency
      });
    });
  }

  // Sort entries
  const sortBy = sort.sort_by || 'date';
  const sortOrder = sort.sort_order || 'desc';
  entries.sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'date') {
      comparison = a.date.getTime() - b.date.getTime();
    } else if (sortBy === 'user_email') {
      comparison = a.user_email.localeCompare(b.user_email);
    } else if (sortBy === 'ticket_title') {
      comparison = a.ticket_title.localeCompare(b.ticket_title);
    } else if (sortBy === 'quantity') {
      comparison = a.quantity - b.quantity;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // Pagination
  const total = entries.length;
  const paginatedEntries = entries.slice(offset, offset + pageSize);

  return {
    data: paginatedEntries,
    total,
    page,
    page_size: pageSize,
    total_pages: Math.ceil(total / pageSize),
  };
};
