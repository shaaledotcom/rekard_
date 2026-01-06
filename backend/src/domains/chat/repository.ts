// Chat repository - database operations using Drizzle ORM
import { eq, and, lt, desc } from 'drizzle-orm';
import { db, chatMessages, ticketEvents } from '../../db/index';
import type {
  Message,
  CreateMessageRequest,
  UpdateMessageRequest,
  MessagesResponse,
} from './types';

// Transform database row to API response format
const transformMessage = (row: typeof chatMessages.$inferSelect): Message => ({
  id: row.id,
  ticket_id: String(row.eventId || ''),
  user_id: row.userId,
  username: row.userName || '',
  content: row.message,
  is_pinned: row.isModerated ?? false,
  created_at: row.createdAt,
  updated_at: row.updatedAt,
});

// Helper function to get event_id from ticket_id
// Returns the first event associated with the ticket, or null if none found
const getEventIdFromTicketId = async (ticketId: number): Promise<number | null> => {
  const [ticketEvent] = await db
    .select({ eventId: ticketEvents.eventId })
    .from(ticketEvents)
    .where(eq(ticketEvents.ticketId, ticketId))
    .limit(1);
  
  return ticketEvent?.eventId || null;
};

export const createMessage = async (
  userId: string | undefined,
  username: string,
  data: CreateMessageRequest,
  tenantId: string,
  appId: string
): Promise<Message> => {
  // Resolve event_id from ticket_id
  const ticketId = parseInt(data.ticket_id, 10);
  const eventId = ticketId ? await getEventIdFromTicketId(ticketId) : null;

  const [message] = await db
    .insert(chatMessages)
    .values({
      appId: appId,
      tenantId: tenantId,
      eventId: eventId,
      userId: userId || '',
      userName: username || data.username || 'Anonymous',
      userEmail: null,
      message: data.content,
      messageType: 'text',
      isModerated: false,
    })
    .returning();

  return transformMessage(message);
};

export const getMessageById = async (messageId: number): Promise<Message | null> => {
  const [message] = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.id, messageId))
    .limit(1);

  return message ? transformMessage(message) : null;
};

export const updateMessage = async (
  messageId: number,
  data: UpdateMessageRequest
): Promise<Message | null> => {
  const updates: Partial<typeof chatMessages.$inferInsert> = { updatedAt: new Date() };
  
  if (data.content !== undefined) updates.message = data.content;
  if (data.is_pinned !== undefined) updates.isModerated = data.is_pinned;

  const [message] = await db
    .update(chatMessages)
    .set(updates)
    .where(eq(chatMessages.id, messageId))
    .returning();

  return message ? transformMessage(message) : null;
};

export const deleteMessage = async (messageId: number): Promise<boolean> => {
  const result = await db
    .delete(chatMessages)
    .where(eq(chatMessages.id, messageId))
    .returning({ id: chatMessages.id });

  return result.length > 0;
};

export const getMessages = async (
  ticketId: string,
  limit: number = 20,
  cursor?: Date
): Promise<MessagesResponse> => {
  // Resolve event_id from ticket_id
  const ticketIdNum = parseInt(ticketId, 10);
  const eventId = ticketIdNum ? await getEventIdFromTicketId(ticketIdNum) : null;

  if (!eventId) {
    // No event found for this ticket, return empty result
    return {
      messages: [],
      has_more: false,
      next_cursor: undefined,
    };
  }

  const conditions = [eq(chatMessages.eventId, eventId)];

  if (cursor) {
    conditions.push(lt(chatMessages.createdAt, cursor));
  }

  const messages = await db
    .select()
    .from(chatMessages)
    .where(and(...conditions))
    .orderBy(desc(chatMessages.createdAt))
    .limit(limit + 1);

  const hasMore = messages.length > limit;
  if (hasMore) {
    messages.pop();
  }

  const nextCursor = hasMore && messages.length > 0
    ? messages[messages.length - 1].createdAt.toISOString()
    : undefined;

  return {
    messages: messages.reverse().map(transformMessage),
    has_more: hasMore,
    next_cursor: nextCursor,
  };
};

export const pinMessage = async (
  messageId: number,
  isPinned: boolean
): Promise<Message | null> => {
  const [message] = await db
    .update(chatMessages)
    .set({
      isModerated: isPinned,
      updatedAt: new Date(),
    })
    .where(eq(chatMessages.id, messageId))
    .returning();

  return message ? transformMessage(message) : null;
};

export const getPinnedMessages = async (ticketId: string): Promise<Message[]> => {
  // Resolve event_id from ticket_id
  const ticketIdNum = parseInt(ticketId, 10);
  const eventId = ticketIdNum ? await getEventIdFromTicketId(ticketIdNum) : null;

  if (!eventId) {
    // No event found for this ticket, return empty result
    return [];
  }
  
  const messages = await db
    .select()
    .from(chatMessages)
    .where(
      and(
        eq(chatMessages.eventId, eventId),
        eq(chatMessages.isModerated, true)
      )
    )
    .orderBy(desc(chatMessages.createdAt));

  return messages.map(transformMessage);
};
