// Viewer chat routes
import { Router, Response } from 'express';
import * as chatService from '../../domains/chat/service.js';
import * as chatWebSocket from '../../domains/chat/websocket.js';
import type {
  CreateMessageRequest,
  UpdateMessageRequest,
} from '../../domains/chat/types.js';
import { viewerTenantMiddleware } from '../../shared/middleware/tenant.js';
import { ok, created, noContent, badRequest } from '../../shared/utils/response.js';
import type { AppRequest } from '../../shared/types/index.js';

const router = Router();

// Apply tenant middleware (optional auth - anonymous allowed)
router.use(viewerTenantMiddleware);

// Get username from request (session or body)
const getUsername = (req: AppRequest, bodyUsername?: string): string => {
  return req.tenant?.userId || bodyUsername || 'Anonymous';
};

// Get messages
router.get('/messages', async (req: AppRequest, res: Response) => {
  const ticketId = req.query.ticket_id as string;

  if (!ticketId) {
    return badRequest(res, 'Ticket ID is required');
  }

  const limit = parseInt(req.query.limit as string, 10) || 20;
  const cursor = req.query.cursor ? new Date(req.query.cursor as string) : undefined;

  const result = await chatService.getMessages(ticketId, limit, cursor);
  ok(res, result);
});

// Get pinned messages
router.get('/messages/pinned', async (req: AppRequest, res: Response) => {
  const ticketId = req.query.ticket_id as string;

  if (!ticketId) {
    return badRequest(res, 'Ticket ID is required');
  }

  const messages = await chatService.getPinnedMessages(ticketId);
  ok(res, { messages });
});

// Post message
router.post('/messages', async (req: AppRequest, res: Response) => {
  const userId = req.tenant?.userId;
  const data: CreateMessageRequest = req.body;

  if (!data.ticket_id) {
    return badRequest(res, 'Ticket ID is required');
  }
  if (!data.content) {
    return badRequest(res, 'Message content is required');
  }

  const username = getUsername(req, data.username);
  const tenantId = req.tenant?.tenantId || '00000000-0000-0000-0000-000000000000';
  const appId = req.tenant?.appId || 'public';

  const message = await chatService.createMessage(userId, username, data, tenantId, appId);

  // Broadcast to WebSocket clients
  chatWebSocket.broadcastNewMessage(message);

  created(res, message, 'Message sent');
});

// Update message
router.patch('/messages/:id', async (req: AppRequest, res: Response) => {
  const messageId = parseInt(req.params.id, 10);

  if (isNaN(messageId)) {
    return badRequest(res, 'Invalid message ID');
  }

  const userId = req.tenant?.userId;
  const username = getUsername(req, req.body.username);
  const data: UpdateMessageRequest = { content: req.body.content };

  const message = await chatService.updateMessage(messageId, userId, username, data);

  // Broadcast update
  chatWebSocket.broadcastUpdateMessage(message);

  ok(res, message, 'Message updated');
});

// Delete message
router.delete('/messages/:id', async (req: AppRequest, res: Response) => {
  const messageId = parseInt(req.params.id, 10);

  if (isNaN(messageId)) {
    return badRequest(res, 'Invalid message ID');
  }

  // Get message before deletion for broadcast
  const message = await chatService.getMessage(messageId);

  const userId = req.tenant?.userId;
  const username = getUsername(req, req.body?.username);

  await chatService.deleteMessage(messageId, userId, username);

  // Broadcast deletion
  chatWebSocket.broadcastDeleteMessage(message);

  noContent(res);
});

// Pin/unpin message (requires auth or producer role in real impl)
router.patch('/messages/:id/pin', async (req: AppRequest, res: Response) => {
  const messageId = parseInt(req.params.id, 10);

  if (isNaN(messageId)) {
    return badRequest(res, 'Invalid message ID');
  }

  const isPinned = req.body.is_pinned === true;

  const message = await chatService.pinMessage(messageId, isPinned);

  // Broadcast pin state change
  chatWebSocket.broadcastPinMessage(message);

  ok(res, message, isPinned ? 'Message pinned' : 'Message unpinned');
});

export const chatRoutes: Router = router;

