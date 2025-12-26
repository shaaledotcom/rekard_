import { pgTable, serial, uuid, varchar, integer, text, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import { events } from './events';
import { tenants } from './tenants';

export const chatMessages = pgTable('chat_messages', {
  id: serial('id').primaryKey(),
  appId: varchar('app_id', { length: 255 }).notNull().default('public'),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  eventId: integer('event_id').references(() => events.id),
  userId: varchar('user_id', { length: 255 }).notNull(),
  userName: varchar('user_name', { length: 255 }),
  userEmail: varchar('user_email', { length: 255 }),
  message: text('message').notNull(),
  messageType: varchar('message_type', { length: 50 }).default('text'),
  isModerated: boolean('is_moderated').default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('idx_chat_messages_tenant').on(table.tenantId),
  eventIdIdx: index('idx_chat_messages_event_id').on(table.eventId),
  createdAtIdx: index('idx_chat_messages_created_at').on(table.createdAt),
}));

