import { pgTable, serial, varchar, integer, decimal, jsonb, timestamp, index } from 'drizzle-orm/pg-core';
import { tickets } from './tickets';
import { events } from './events';

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  appId: varchar('app_id', { length: 255 }).notNull(),
  tenantId: varchar('tenant_id', { length: 255 }).notNull(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  ticketId: integer('ticket_id').references(() => tickets.id),
  eventId: integer('event_id').references(() => events.id),
  orderNumber: varchar('order_number', { length: 255 }).notNull().unique(),
  status: varchar('status', { length: 50 }).default('pending'),
  quantity: integer('quantity').notNull(),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 10 }).default('INR'),
  paymentMethod: varchar('payment_method', { length: 100 }),
  externalPaymentId: varchar('external_payment_id', { length: 255 }),
  customerEmail: varchar('customer_email', { length: 255 }),
  customerName: varchar('customer_name', { length: 255 }),
  customerPhone: varchar('customer_phone', { length: 50 }),
  billingAddress: jsonb('billing_address'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  appTenantIdx: index('idx_orders_app_tenant').on(table.appId, table.tenantId),
  userIdIdx: index('idx_orders_user_id').on(table.userId),
  statusIdx: index('idx_orders_status').on(table.status),
  orderNumberIdx: index('idx_orders_order_number').on(table.orderNumber),
  ticketIdIdx: index('idx_orders_ticket_id').on(table.ticketId),
  eventIdIdx: index('idx_orders_event_id').on(table.eventId),
  createdAtIdx: index('idx_orders_created_at').on(table.createdAt),
}));

