import { pgTable, serial, varchar, integer, decimal, jsonb, timestamp, index, unique } from 'drizzle-orm/pg-core';
import { tickets } from './tickets';

export const carts = pgTable('carts', {
  id: serial('id').primaryKey(),
  appId: varchar('app_id', { length: 255 }).notNull(),
  tenantId: varchar('tenant_id', { length: 255 }).notNull(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  status: varchar('status', { length: 50 }).default('active'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  appTenantUserIdx: index('idx_carts_app_tenant_user').on(table.appId, table.tenantId, table.userId),
  statusIdx: index('idx_carts_status').on(table.status),
}));

export const cartItems = pgTable('cart_items', {
  id: serial('id').primaryKey(),
  cartId: integer('cart_id').notNull().references(() => carts.id, { onDelete: 'cascade' }),
  ticketId: integer('ticket_id').notNull().references(() => tickets.id),
  quantity: integer('quantity').notNull().default(1),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 10 }).default('INR'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  cartIdIdx: index('idx_cart_items_cart_id').on(table.cartId),
  ticketIdIdx: index('idx_cart_items_ticket_id').on(table.ticketId),
  cartTicketUnique: unique('cart_items_cart_id_ticket_id_unique').on(table.cartId, table.ticketId),
}));

export const cartCoupons = pgTable('cart_coupons', {
  id: serial('id').primaryKey(),
  cartId: integer('cart_id').notNull().references(() => carts.id, { onDelete: 'cascade' }),
  couponCode: varchar('coupon_code', { length: 100 }).notNull(),
  discountAmount: decimal('discount_amount', { precision: 10, scale: 2 }).notNull(),
  discountType: varchar('discount_type', { length: 50 }).notNull(),
  appliedAt: timestamp('applied_at').notNull().defaultNow(),
}, (table) => ({
  cartIdIdx: index('idx_cart_coupons_cart_id').on(table.cartId),
}));

