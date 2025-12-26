// Chat repository - database operations using Drizzle ORM
import { eq, and, lt, desc } from 'drizzle-orm';
import { db, chatMessages } from '../../db/index';
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

export const createMessage = async (
  userId: string | undefined,
  username: string,
  data: CreateMessageRequest
): Promise<Message> => {
  const [message] = await db
    .insert(chatMessages)
    .values({
      appId: 'default',
      tenantId: 'default',
      eventId: parseInt(data.ticket_id, 10) || null,
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
  const eventId = parseInt(ticketId, 10);
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
  const eventId = parseInt(ticketId, 10);
  
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
