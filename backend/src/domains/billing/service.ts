// Billing service - business logic for billing operations
import * as repo from './repository.js';
import * as tenantService from '../tenant/service.js';
import type {
  BillingPlan,
  UserWallet,
  Invoice,
  UserSubscription,
  CreateBillingPlanRequest,
  UpdateBillingPlanRequest,
  PurchasePlanRequest,
  PurchaseTicketsRequest,
  ConsumeTicketsRequest,
  BillingPlanFilter,
  InvoiceFilter,
  WalletTransactionFilter,
  PaginationParams,
  SortParams,
  ListResponse,
  InvoiceItem,
  SalesReportEntry,
  SalesReportFilter,
} from './types.js';
import { log } from '../../shared/middleware/logger.js';
import { getPlanTier } from '../../shared/middleware/plan.js';

// Ticket pricing tiers
const TICKET_PRICE_TIERS = [
  { min: 1, max: 99, price: 30 },
  { min: 100, max: 499, price: 25 },
  { min: 500, max: 999, price: 20 },
  { min: 1000, max: Infinity, price: 15 },
];

export const getTicketUnitPrice = (quantity: number): number => {
  const tier = TICKET_PRICE_TIERS.find((t) => quantity >= t.min && quantity <= t.max);
  return tier?.price || TICKET_PRICE_TIERS[0].price;
};

// Plan management
export const getPlans = async (
  appId: string,
  tenantId: string,
  filter: BillingPlanFilter = {},
  pagination: PaginationParams = {},
  sort: SortParams = {}
): Promise<ListResponse<BillingPlan>> => {
  return repo.getBillingPlans(appId, tenantId, filter, pagination, sort);
};

export const getPlanById = async (
  appId: string,
  tenantId: string,
  planId: number
): Promise<BillingPlan | null> => {
  return repo.getBillingPlanById(appId, tenantId, planId);
};

export const createPlan = async (
  appId: string,
  tenantId: string,
  data: CreateBillingPlanRequest
): Promise<BillingPlan> => {
  const plan = await repo.createBillingPlan(appId, tenantId, data);
  log.info(`Created billing plan ${plan.id} for tenant ${tenantId}`);
  return plan;
};

export const updatePlan = async (
  appId: string,
  tenantId: string,
  planId: number,
  data: UpdateBillingPlanRequest
): Promise<BillingPlan | null> => {
  const plan = await repo.updateBillingPlan(appId, tenantId, planId, data);
  if (plan) {
    log.info(`Updated billing plan ${planId} for tenant ${tenantId}`);
  }
  return plan;
};

export const deletePlan = async (
  appId: string,
  tenantId: string,
  planId: number
): Promise<boolean> => {
  const deleted = await repo.deleteBillingPlan(appId, tenantId, planId);
  if (deleted) {
    log.info(`Deleted billing plan ${planId} for tenant ${tenantId}`);
  }
  return deleted;
};

// Wallet operations
export const getWallet = async (
  appId: string,
  tenantId: string,
  userId: string
): Promise<UserWallet> => {
  return repo.getOrCreateUserWallet(appId, tenantId, userId);
};

export const getTransactions = async (
  appId: string,
  tenantId: string,
  filter: WalletTransactionFilter = {},
  pagination: PaginationParams = {}
) => {
  return repo.getWalletTransactions(appId, tenantId, filter, pagination);
};

// Subscription operations
export const getSubscription = async (
  appId: string,
  tenantId: string,
  userId: string
): Promise<UserSubscription | null> => {
  const subscription = await repo.getUserSubscription(appId, tenantId, userId);
  
  // Include plan details if subscription exists
  if (subscription) {
    const plan = await repo.getBillingPlanById(appId, tenantId, subscription.plan_id);
    if (plan) {
      subscription.plan = plan;
    }
  }
  
  return subscription;
};

export const purchasePlan = async (
  appId: string,
  tenantId: string,
  userId: string,
  request: PurchasePlanRequest
): Promise<{ subscription: UserSubscription; invoice: Invoice; proActivation?: { success: boolean; old_app_id: string; new_app_id: string } }> => {
  const plan = await repo.getBillingPlanById(appId, tenantId, request.plan_id);
  if (!plan) {
    throw new Error('Plan not found');
  }
  if (!plan.is_active) {
    throw new Error('Plan is not active');
  }

  // Calculate subscription period
  const periodStart = new Date();
  const periodEnd = new Date();
  if (plan.billing_cycle === 'monthly') {
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  } else if (plan.billing_cycle === 'yearly') {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  }

  // Create subscription
  const subscription = await repo.createSubscription(
    appId,
    tenantId,
    userId,
    plan.id,
    periodStart,
    periodEnd,
    { paymentMethodId: request.payment_method_id }
  );

  // Add initial tickets to wallet
  if (plan.initial_tickets > 0) {
    await repo.updateWalletBalance(
      appId,
      tenantId,
      userId,
      plan.initial_tickets,
      'plan_purchase',
      'subscription',
      String(subscription.id),
      `Initial tickets from ${plan.name}`,
      { plan_id: plan.id }
    );
  }

  // Create invoice
  const invoiceNumber = `INV-PLAN-${Date.now()}-${subscription.id}`;
  const taxRate = 0; // Fetch from config in real implementation
  const taxAmount = plan.price * taxRate;
  const totalAmount = plan.price + taxAmount;

  const items: InvoiceItem[] = [
    {
      item_type: 'subscription',
      item_name: plan.name,
      quantity: 1,
      unit_price: plan.price,
      total_price: plan.price,
      currency: plan.currency,
      metadata: { plan_id: plan.id, billing_cycle: plan.billing_cycle },
    },
  ];

  const invoice = await repo.createInvoice(
    appId,
    tenantId,
    userId,
    invoiceNumber,
    plan.price,
    taxAmount,
    totalAmount,
    plan.currency,
    taxRate,
    items,
    {
      paymentMethod: request.payment_method_id,
      externalPaymentId: request.external_payment_id,
      billingAddress: request.billing_address,
    }
  );

  log.info(`User ${userId} purchased plan ${plan.id} (subscription ${subscription.id})`);

  // Check if this is a Pro or Premium plan and activate Pro features
  const planTier = getPlanTier(plan.name);
  let proActivation: { success: boolean; old_app_id: string; new_app_id: string } | undefined;

  if (planTier === 'pro' || planTier === 'premium') {
    try {
      // Get or create the tenant for this user
      const { tenant } = await tenantService.getOrCreateTenantForUser(userId);
      
      // Activate Pro: Update appId from 'public' to tenant.id (UUID)
      // This cascades the change across all tenant-scoped tables
      const result = await tenantService.activatePro({
        tenant_id: tenant.id,
        // Use tenant.id as the new appId for Pro users
        custom_app_id: tenant.id,
      });

      proActivation = {
        success: result.success,
        old_app_id: result.old_app_id,
        new_app_id: result.new_app_id,
      };

      log.info(`Pro activation for tenant ${tenant.id} (user ${userId}): ${result.old_app_id} -> ${result.new_app_id}, ${result.total_rows_affected} rows updated`);
    } catch (error) {
      log.error(`Failed to activate Pro for user ${userId}:`, error);
      // Don't fail the subscription, just log the error
      // The cascade can be retried later
    }
  }

  return { subscription, invoice, proActivation };
};

/**
 * Admin-only: Grant Pro or Premium plan to a tenant without payment.
 * Use when billing failed but user paid, or for manual/compensation grants.
 *
 * @param tenantId - Tenant UUID (from tenants table)
 * @param planName - 'Pro' or 'Premium'
 * @returns Same shape as purchasePlan (subscription, invoice, proActivation)
 */
export const adminGrantPlan = async (
  tenantId: string,
  planName: 'Pro' | 'Premium'
): Promise<{ subscription: UserSubscription; invoice: Invoice; proActivation?: { success: boolean; old_app_id: string; new_app_id: string } }> => {
  const plan = await repo.getBillingPlanByName(planName);
  if (!plan) {
    throw new Error(`Plan "${planName}" not found. Run seed to create default plans.`);
  }

  const tenant = await tenantService.getTenantById(tenantId);
  if (!tenant) {
    throw new Error(`Tenant not found: ${tenantId}`);
  }

  const userId = tenant.user_id;
  const appId = tenant.app_id;

  return purchasePlan(appId, tenantId, userId, {
    plan_id: plan.id,
    external_payment_id: `admin-grant-${Date.now()}`,
  });
};

export const cancelSubscription = async (
  appId: string,
  tenantId: string,
  userId: string,
  immediate: boolean = false
): Promise<boolean> => {
  const cancelled = await repo.cancelSubscription(appId, tenantId, userId, !immediate);
  if (cancelled) {
    log.info(`User ${userId} cancelled subscription (immediate: ${immediate})`);
  }
  return cancelled;
};

// Ticket purchase
export const purchaseTickets = async (
  appId: string,
  tenantId: string,
  userId: string,
  request: PurchaseTicketsRequest
): Promise<Invoice> => {
  const wallet = await repo.getOrCreateUserWallet(appId, tenantId, userId);
  const unitPrice = request.unit_price ?? getTicketUnitPrice(request.quantity);
  const currency = request.currency || 'INR';
  const subtotal = unitPrice * request.quantity;
  const taxRate = 0;
  const taxAmount = subtotal * taxRate;
  const totalAmount = subtotal + taxAmount;

  // Update wallet
  await repo.updateWalletBalance(
    appId,
    tenantId,
    userId,
    request.quantity,
    'manual_purchase',
    'tickets',
    '',
    `Purchased ${request.quantity} tickets`,
    { quantity: request.quantity }
  );

  // Create invoice
  const invoiceNumber = `INV-TIX-${Date.now()}-${wallet.id}`;
  const items: InvoiceItem[] = [
    {
      item_type: 'tickets',
      item_name: 'Event Tickets',
      quantity: request.quantity,
      unit_price: unitPrice,
      total_price: subtotal,
      currency,
      metadata: { quantity: request.quantity },
    },
  ];

  const invoice = await repo.createInvoice(
    appId,
    tenantId,
    userId,
    invoiceNumber,
    subtotal,
    taxAmount,
    totalAmount,
    currency,
    taxRate,
    items,
    {
      paymentMethod: request.payment_method_id,
      externalPaymentId: request.external_payment_id,
      billingAddress: request.billing_address,
    }
  );

  log.info(`User ${userId} purchased ${request.quantity} tickets`);

  return invoice;
};

// Ticket consumption
export const consumeTickets = async (
  appId: string,
  tenantId: string,
  userId: string,
  request: ConsumeTicketsRequest
): Promise<{ success: boolean; remaining_balance: number }> => {
  const wallet = await repo.getOrCreateUserWallet(appId, tenantId, userId);

  if (wallet.ticket_balance < request.quantity) {
    throw new Error('Insufficient ticket balance');
  }

  await repo.updateWalletBalance(
    appId,
    tenantId,
    userId,
    -request.quantity,
    'consumption',
    request.reference_type,
    request.reference_id,
    request.description || `Consumed ${request.quantity} tickets`,
    request.metadata || {}
  );

  log.info(`User ${userId} consumed ${request.quantity} tickets for ${request.reference_type}:${request.reference_id}`);

  return {
    success: true,
    remaining_balance: wallet.ticket_balance - request.quantity,
  };
};

// Invoice operations
export const getInvoices = async (
  appId: string,
  tenantId: string,
  filter: InvoiceFilter = {},
  pagination: PaginationParams = {}
): Promise<ListResponse<Invoice>> => {
  return repo.getInvoices(appId, tenantId, filter, pagination);
};

export const getInvoiceById = async (
  appId: string,
  tenantId: string,
  invoiceId: number
): Promise<Invoice | null> => {
  return repo.getInvoiceById(appId, tenantId, invoiceId);
};

export const markInvoicePaid = async (
  appId: string,
  tenantId: string,
  invoiceNumber: string,
  externalPaymentId?: string
): Promise<boolean> => {
  const updated = await repo.updateInvoiceStatus(
    appId,
    tenantId,
    invoiceNumber,
    'paid',
    new Date(),
    externalPaymentId
  );
  if (updated) {
    log.info(`Invoice ${invoiceNumber} marked as paid`);
  }
  return updated;
};

// Audit logging
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
) => {
  return repo.createAuditLog(
    appId,
    tenantId,
    userId,
    action,
    resourceType,
    resourceId,
    oldValue,
    newValue,
    performedBy,
    ipAddress,
    userAgent
  );
};

// ===== Ticket Wallet Allocations =====
export const getAllocations = async (
  appId: string,
  tenantId: string,
  userId: string,
  filter: { ticket_id?: number; status?: string } = {},
  pagination: { page?: number; page_size?: number } = {}
) => {
  return repo.getAllocations(appId, tenantId, { user_id: userId, ...filter }, pagination);
};

export const allocateTickets = async (
  appId: string,
  tenantId: string,
  userId: string,
  ticketId: number,
  quantity: number
) => {
  // Check if allocation already exists
  const existing = await repo.getAllocationByTicket(appId, tenantId, userId, ticketId);
  if (existing) {
    // Update existing allocation
    const newQuantity = existing.allocated_quantity + quantity;
    const newAvailable = existing.available_quantity + quantity;
    
    const updated = await repo.updateAllocation(appId, tenantId, existing.id, {
      allocated_quantity: newQuantity,
      available_quantity: newAvailable,
    });
    
    // Consume tickets from wallet
    await consumeTickets(appId, tenantId, userId, {
      quantity,
      reference_type: 'ticket_allocation',
      reference_id: String(ticketId),
      description: `Additional allocation of ${quantity} tickets for ticket ${ticketId}`,
    });
    
    return updated;
  }

  // Create new allocation and consume tickets
  const transaction = await consumeTickets(appId, tenantId, userId, {
    quantity,
    reference_type: 'ticket_allocation',
    reference_id: String(ticketId),
    description: `Allocated ${quantity} tickets for ticket ${ticketId}`,
  });

  const allocation = await repo.createAllocation(appId, tenantId, userId, ticketId, quantity);
  
  log.info(`Allocated ${quantity} tickets for ticket ${ticketId} by user ${userId}`);
  
  return { allocation, transaction };
};

export const updateAllocation = async (
  appId: string,
  tenantId: string,
  userId: string,
  ticketId: number,
  newQuantity: number
) => {
  const existing = await repo.getAllocationByTicket(appId, tenantId, userId, ticketId);
  if (!existing) {
    throw new Error('Allocation not found');
  }

  const diff = newQuantity - existing.allocated_quantity;
  
  if (diff > 0) {
    // Need more tickets - consume from wallet
    await consumeTickets(appId, tenantId, userId, {
      quantity: diff,
      reference_type: 'ticket_allocation_increase',
      reference_id: String(ticketId),
      description: `Increased allocation by ${diff} tickets for ticket ${ticketId}`,
    });
  } else if (diff < 0) {
    // Releasing tickets - add back to wallet
    await repo.getOrCreateUserWallet(appId, tenantId, userId); // Ensure wallet exists
    await repo.updateWalletBalance(
      appId,
      tenantId,
      userId,
      Math.abs(diff),
      'allocation_decrease',
      'ticket_allocation',
      String(ticketId),
      `Decreased allocation by ${Math.abs(diff)} tickets for ticket ${ticketId}`
    );
  }

  const newAvailable = existing.available_quantity + diff;
  const updated = await repo.updateAllocation(appId, tenantId, existing.id, {
    allocated_quantity: newQuantity,
    available_quantity: Math.max(0, newAvailable),
  });

  log.info(`Updated allocation for ticket ${ticketId} to ${newQuantity} tickets`);
  
  return updated;
};

export const releaseAllocation = async (
  appId: string,
  tenantId: string,
  userId: string,
  ticketId: number
) => {
  const result = await repo.releaseAllocation(appId, tenantId, userId, ticketId);
  if (!result) {
    throw new Error('Allocation not found');
  }

  // Return tickets to wallet
  if (result.released_quantity > 0) {
    await repo.updateWalletBalance(
      appId,
      tenantId,
      userId,
      result.released_quantity,
      'allocation_release',
      'ticket_allocation',
      String(ticketId),
      `Released ${result.released_quantity} tickets from ticket ${ticketId}`
    );
  }

  log.info(`Released allocation for ticket ${ticketId}, returned ${result.released_quantity} tickets`);
  
  return result;
};

// ===== Ticket Buyers =====
export const getTicketBuyers = async (
  appId: string,
  tenantId: string,
  producerUserId: string,
  limit: number = 50,
  paginationToken?: string
) => {
  return repo.getTicketBuyers(appId, tenantId, producerUserId, limit, paginationToken);
};

// ===== Email Access Grants =====
export const grantBulkEmailAccess = async (
  appId: string,
  tenantId: string,
  producerUserId: string,
  emails: string[],
  ticketId: number,
  _quantity: number,
  _eventId?: number
): Promise<{ granted: number; failed: number; results: Array<{ email: string; status: string; error?: string }> }> => {
  const results: Array<{ email: string; status: string; error?: string }> = [];
  let granted = 0;
  let failed = 0;

  for (const email of emails) {
    try {
      // Check if access already exists
      const existing = await repo.getEmailAccessGrant(appId, tenantId, email, ticketId);
      if (existing) {
        results.push({ email, status: 'already_exists' });
        continue;
      }

      await repo.createEmailAccessGrant(appId, tenantId, producerUserId, email, ticketId);
      results.push({ email, status: 'granted' });
      granted++;
    } catch (err) {
      results.push({ email, status: 'failed', error: (err as Error).message });
      failed++;
    }
  }

  log.info(`Granted bulk email access: ${granted} granted, ${failed} failed for ticket ${ticketId}`);
  
  return { granted, failed, results };
};

export const getEmailAccessStatuses = async (
  appId: string,
  tenantId: string,
  emails: string[],
  ticketId: number
) => {
  return repo.getEmailAccessStatuses(appId, tenantId, emails, ticketId);
};

// Sales Report
export const getSalesReport = async (
  appId: string,
  tenantId: string,
  filter: SalesReportFilter = {},
  pagination: PaginationParams = {},
  sort: SortParams = {}
): Promise<ListResponse<SalesReportEntry>> => {
  return repo.getSalesReport(appId, tenantId, filter, pagination, sort);
};

