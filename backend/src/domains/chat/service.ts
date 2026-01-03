// Chat service - business logic
import * as repo from './repository.js';
import type {
  Message,
  CreateMessageRequest,
  UpdateMessageRequest,
  MessagesResponse,
} from './types.js';
import { log } from '../../shared/middleware/logger.js';
import { badRequest, notFound, forbidden } from '../../shared/errors/app-error.js';

const DEFAULT_USERNAME = 'Anonymous';
const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 20;

export const createMessage = async (
  userId: string | undefined,
  username: string | undefined,
  data: CreateMessageRequest,
  tenantId: string,
  appId: string
): Promise<Message> => {
  if (!data.ticket_id) {
    throw badRequest('Ticket ID is required');
  }
  if (!data.content || data.content.trim() === '') {
    throw badRequest('Message content is required');
  }

  const finalUsername = username || data.username || DEFAULT_USERNAME;

  const message = await repo.createMessage(userId, finalUsername, data, tenantId, appId);
  log.info(`Created chat message ${message.id} for ticket ${data.ticket_id}`);
  return message;
};

export const getMessage = async (messageId: number): Promise<Message> => {
  const message = await repo.getMessageById(messageId);
  if (!message) {
    throw notFound('Message');
  }
  return message;
};

export const updateMessage = async (
  messageId: number,
  userId: string | undefined,
  username: string,
  data: UpdateMessageRequest
): Promise<Message> => {
  const message = await repo.getMessageById(messageId);
  if (!message) {
    throw notFound('Message');
  }

  // Check ownership
  if (!canModifyMessage(message, userId, username)) {
    throw forbidden('You can only modify your own messages');
  }

  if (!data.content || data.content.trim() === '') {
    throw badRequest('Message content is required');
  }

  const updated = await repo.updateMessage(messageId, data);
  if (!updated) {
    throw notFound('Message');
  }

  log.info(`Updated chat message ${messageId}`);
  return updated;
};

export const deleteMessage = async (
  messageId: number,
  userId: string | undefined,
  username: string
): Promise<void> => {
  const message = await repo.getMessageById(messageId);
  if (!message) {
    throw notFound('Message');
  }

  // Check ownership
  if (!canModifyMessage(message, userId, username)) {
    throw forbidden('You can only delete your own messages');
  }

  const deleted = await repo.deleteMessage(messageId);
  if (!deleted) {
    throw notFound('Message');
  }

  log.info(`Deleted chat message ${messageId}`);
};

export const getMessages = async (
  ticketId: string,
  limit?: number,
  cursor?: Date
): Promise<MessagesResponse> => {
  if (!ticketId) {
    throw badRequest('Ticket ID is required');
  }

  const effectiveLimit = Math.min(limit || DEFAULT_LIMIT, MAX_LIMIT);

  return repo.getMessages(ticketId, effectiveLimit, cursor);
};

export const pinMessage = async (
  messageId: number,
  isPinned: boolean
): Promise<Message> => {
  const message = await repo.getMessageById(messageId);
  if (!message) {
    throw notFound('Message');
  }

  const updated = await repo.pinMessage(messageId, isPinned);
  if (!updated) {
    throw notFound('Message');
  }

  log.info(`${isPinned ? 'Pinned' : 'Unpinned'} chat message ${messageId}`);
  return updated;
};

export const getPinnedMessages = async (ticketId: string): Promise<Message[]> => {
  if (!ticketId) {
    throw badRequest('Ticket ID is required');
  }

  return repo.getPinnedMessages(ticketId);
};

// Helper to check if user can modify a message
const canModifyMessage = (
  message: Message,
  userId: string | undefined,
  username: string
): boolean => {
  // If message has user_id, check that
  if (message.user_id) {
    return userId === message.user_id;
  }
  // Otherwise check username
  return message.username === username;
};

