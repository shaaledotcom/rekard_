import { pgTable, serial, uuid, varchar, text, timestamp, boolean, decimal, integer, jsonb, index, unique } from 'drizzle-orm/pg-core';
import { events } from './events';
import { tenants } from './tenants';

export const tickets = pgTable('tickets', {
  id: serial('id').primaryKey(),
  appId: varchar('app_id', { length: 255 }).notNull().default('public'),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  url: text('url'),
  thumbnailImagePortrait: text('thumbnail_image_portrait'),
  featuredImage: text('featured_image'),
  featuredVideo: text('featured_video'),
  purchaseWithoutLogin: boolean('purchase_without_login').default(false),
  price: decimal('price', { precision: 10, scale: 2 }),
  currency: varchar('currency', { length: 10 }).default('INR'),
  totalQuantity: integer('total_quantity'),
  soldQuantity: integer('sold_quantity').default(0),
  maxQuantityPerUser: integer('max_quantity_per_user').default(1),
  geoblockingEnabled: boolean('geoblocking_enabled').default(false),
  geoblockingCountries: jsonb('geoblocking_countries'),
  status: varchar('status', { length: 50 }).default('draft'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  appTenantIdx: index('idx_tickets_app_tenant').on(table.appId, table.tenantId),
  statusIdx: index('idx_tickets_status').on(table.status),
}));

export const ticketEvents = pgTable('ticket_events', {
  id: serial('id').primaryKey(),
  ticketId: integer('ticket_id').notNull().references(() => tickets.id, { onDelete: 'cascade' }),
  eventId: integer('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  ticketIdIdx: index('idx_ticket_events_ticket_id').on(table.ticketId),
  eventIdIdx: index('idx_ticket_events_event_id').on(table.eventId),
  ticketEventUnique: unique('ticket_events_ticket_id_event_id_unique').on(table.ticketId, table.eventId),
}));

export const ticketCoupons = pgTable('ticket_coupons', {
  id: serial('id').primaryKey(),
  ticketId: integer('ticket_id').notNull().references(() => tickets.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }),
  code: varchar('code', { length: 100 }).notNull(),
  count: integer('count'),
  activationTime: timestamp('activation_time'),
  expiryTime: timestamp('expiry_time'),
  discount: decimal('discount', { precision: 10, scale: 2 }),
  usedCount: integer('used_count').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  ticketIdIdx: index('idx_ticket_coupons_ticket_id').on(table.ticketId),
  codeIdx: index('idx_ticket_coupons_code').on(table.code),
}));

export const ticketPricing = pgTable('ticket_pricing', {
  id: serial('id').primaryKey(),
  ticketId: integer('ticket_id').notNull().references(() => tickets.id, { onDelete: 'cascade' }),
  currency: varchar('currency', { length: 10 }).notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  isDefault: boolean('is_default').default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  ticketIdIdx: index('idx_ticket_pricing_ticket_id').on(table.ticketId),
}));

export const ticketSponsors = pgTable('ticket_sponsors', {
  id: serial('id').primaryKey(),
  ticketId: integer('ticket_id').notNull().references(() => tickets.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }),
  imageUrl: text('image_url'),
  link: text('link'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  ticketIdIdx: index('idx_ticket_sponsors_ticket_id').on(table.ticketId),
}));

