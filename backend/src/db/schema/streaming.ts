import { pgTable, serial, uuid, varchar, integer, text, timestamp, index } from 'drizzle-orm/pg-core';
import { orders } from './orders';
import { tickets } from './tickets';
import { events } from './events';
import { tenants } from './tenants';

export const streamingSessions = pgTable('streaming_sessions', {
  id: serial('id').primaryKey(),
  appId: varchar('app_id', { length: 255 }).notNull().default('public'),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  orderId: integer('order_id').references(() => orders.id),
  ticketId: integer('ticket_id').notNull().references(() => tickets.id),
  eventId: integer('event_id').references(() => events.id),
  userId: varchar('user_id', { length: 255 }).notNull(),
  userEmail: varchar('user_email', { length: 255 }),
  userName: varchar('user_name', { length: 255 }),
  sessionToken: varchar('session_token', { length: 255 }).notNull().unique(),
  ipAddress: varchar('ip_address', { length: 50 }),
  userAgent: text('user_agent'),
  status: varchar('status', { length: 50 }).default('active'),
  startedAt: timestamp('started_at').notNull().defaultNow(),
  lastActivityAt: timestamp('last_activity_at').notNull().defaultNow(),
  endedAt: timestamp('ended_at'),
}, (table) => ({
  tenantIdx: index('idx_streaming_sessions_tenant').on(table.tenantId),
  userIdIdx: index('idx_streaming_sessions_user_id').on(table.userId),
  tokenIdx: index('idx_streaming_sessions_token').on(table.sessionToken),
  statusIdx: index('idx_streaming_sessions_status').on(table.status),
}));

