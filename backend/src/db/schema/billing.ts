import { pgTable, serial, uuid, varchar, integer, decimal, text, jsonb, timestamp, boolean, index, unique } from 'drizzle-orm/pg-core';
import { tickets } from './tickets';
import { orders } from './orders';
import { tenants } from './tenants';

export const billingPlans = pgTable('billing_plans', {
  id: serial('id').primaryKey(),
  appId: varchar('app_id', { length: 255 }).notNull().default('public'),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 10 }).default('INR'),
  billingCycle: varchar('billing_cycle', { length: 50 }).default('monthly'),
  initialTickets: integer('initial_tickets').default(0),
  features: jsonb('features').default([]),
  isActive: boolean('is_active').default(true),
  isPublic: boolean('is_public').default(false),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  appTenantIdx: index('idx_billing_plans_app_tenant').on(table.appId, table.tenantId),
}));

export const userWallets = pgTable('user_wallets', {
  id: serial('id').primaryKey(),
  appId: varchar('app_id', { length: 255 }).notNull().default('public'),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  userId: varchar('user_id', { length: 255 }).notNull(),
  ticketBalance: integer('ticket_balance').default(0),
  currency: varchar('currency', { length: 10 }).default('INR'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  tenantUserUnique: unique('user_wallets_tenant_user_unique').on(table.tenantId, table.userId),
  tenantUserIdx: index('idx_user_wallets_tenant_user').on(table.tenantId, table.userId),
}));

export const walletTransactions = pgTable('wallet_transactions', {
  id: serial('id').primaryKey(),
  appId: varchar('app_id', { length: 255 }).notNull().default('public'),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  userId: varchar('user_id', { length: 255 }).notNull(),
  transactionType: varchar('transaction_type', { length: 50 }).notNull(),
  amount: integer('amount').notNull(),
  currency: varchar('currency', { length: 10 }).default('INR'),
  balanceBefore: integer('balance_before').notNull(),
  balanceAfter: integer('balance_after').notNull(),
  referenceType: varchar('reference_type', { length: 50 }),
  referenceId: varchar('reference_id', { length: 255 }),
  description: text('description'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('idx_wallet_transactions_tenant').on(table.tenantId),
  userIdIdx: index('idx_wallet_transactions_user_id').on(table.userId),
  createdAtIdx: index('idx_wallet_transactions_created_at').on(table.createdAt),
}));

export const invoices = pgTable('invoices', {
  id: serial('id').primaryKey(),
  appId: varchar('app_id', { length: 255 }).notNull().default('public'),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  userId: varchar('user_id', { length: 255 }).notNull(),
  invoiceNumber: varchar('invoice_number', { length: 255 }).notNull().unique(),
  status: varchar('status', { length: 50 }).default('pending'),
  subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull(),
  taxAmount: decimal('tax_amount', { precision: 10, scale: 2 }).default('0'),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 10 }).default('INR'),
  taxRate: decimal('tax_rate', { precision: 5, scale: 2 }).default('0'),
  dueDate: timestamp('due_date'),
  paidAt: timestamp('paid_at'),
  paymentMethod: varchar('payment_method', { length: 100 }),
  externalPaymentId: varchar('external_payment_id', { length: 255 }),
  billingAddress: jsonb('billing_address'),
  items: jsonb('items').default([]),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('idx_invoices_tenant').on(table.tenantId),
  userIdIdx: index('idx_invoices_user_id').on(table.userId),
  statusIdx: index('idx_invoices_status').on(table.status),
}));

export const userSubscriptions = pgTable('user_subscriptions', {
  id: serial('id').primaryKey(),
  appId: varchar('app_id', { length: 255 }).notNull().default('public'),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  userId: varchar('user_id', { length: 255 }).notNull(),
  planId: integer('plan_id').notNull().references(() => billingPlans.id),
  status: varchar('status', { length: 50 }).default('active'),
  currentPeriodStart: timestamp('current_period_start').notNull(),
  currentPeriodEnd: timestamp('current_period_end').notNull(),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false),
  cancelledAt: timestamp('cancelled_at'),
  trialStart: timestamp('trial_start'),
  trialEnd: timestamp('trial_end'),
  paymentMethodId: varchar('payment_method_id', { length: 255 }),
  externalSubscriptionId: varchar('external_subscription_id', { length: 255 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('idx_user_subscriptions_tenant').on(table.tenantId),
  userIdIdx: index('idx_user_subscriptions_user_id').on(table.userId),
  statusIdx: index('idx_user_subscriptions_status').on(table.status),
}));

export const billingAuditLogs = pgTable('billing_audit_logs', {
  id: serial('id').primaryKey(),
  appId: varchar('app_id', { length: 255 }).notNull().default('public'),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  userId: varchar('user_id', { length: 255 }).notNull(),
  action: varchar('action', { length: 100 }).notNull(),
  entityType: varchar('entity_type', { length: 100 }),
  entityId: integer('entity_id'),
  details: jsonb('details'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('idx_billing_audit_logs_tenant').on(table.tenantId),
}));

export const ticketWalletAllocations = pgTable('ticket_wallet_allocations', {
  id: serial('id').primaryKey(),
  appId: varchar('app_id', { length: 255 }).notNull().default('public'),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  userId: varchar('user_id', { length: 255 }).notNull(),
  ticketId: integer('ticket_id').notNull().references(() => tickets.id),
  orderId: integer('order_id').references(() => orders.id),
  quantity: integer('quantity').notNull(),
  allocatedAt: timestamp('allocated_at').notNull().defaultNow(),
  expiresAt: timestamp('expires_at'),
  usedAt: timestamp('used_at'),
  status: varchar('status', { length: 50 }).default('active'),
}, (table) => ({
  tenantIdx: index('idx_ticket_wallet_allocations_tenant').on(table.tenantId),
  userIdIdx: index('idx_ticket_wallet_allocations_user_id').on(table.userId),
  ticketIdIdx: index('idx_ticket_wallet_allocations_ticket_id').on(table.ticketId),
}));

export const emailAccessGrants = pgTable('email_access_grants', {
  id: serial('id').primaryKey(),
  appId: varchar('app_id', { length: 255 }).notNull().default('public'),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  userId: varchar('user_id', { length: 255 }).notNull(),
  ticketId: integer('ticket_id').notNull().references(() => tickets.id),
  email: varchar('email', { length: 255 }).notNull(),
  grantedAt: timestamp('granted_at').notNull().defaultNow(),
  expiresAt: timestamp('expires_at'),
  usedAt: timestamp('used_at'),
  status: varchar('status', { length: 50 }).default('active'),
}, (table) => ({
  tenantIdx: index('idx_email_access_grants_tenant').on(table.tenantId),
  emailIdx: index('idx_email_access_grants_email').on(table.email),
  ticketIdIdx: index('idx_email_access_grants_ticket_id').on(table.ticketId),
}));

export const ticketBuyers = pgTable('ticket_buyers', {
  id: serial('id').primaryKey(),
  appId: varchar('app_id', { length: 255 }).notNull().default('public'),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  ticketId: integer('ticket_id').notNull().references(() => tickets.id),
  buyerEmail: varchar('buyer_email', { length: 255 }).notNull(),
  buyerName: varchar('buyer_name', { length: 255 }),
  buyerPhone: varchar('buyer_phone', { length: 50 }),
  orderId: integer('order_id').references(() => orders.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('idx_ticket_buyers_tenant').on(table.tenantId),
  ticketIdIdx: index('idx_ticket_buyers_ticket_id').on(table.ticketId),
  emailIdx: index('idx_ticket_buyers_email').on(table.buyerEmail),
  ticketEmailUnique: unique('ticket_buyers_ticket_id_buyer_email_unique').on(table.ticketId, table.buyerEmail),
}));

