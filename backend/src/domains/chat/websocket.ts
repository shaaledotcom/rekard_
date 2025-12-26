// Chat WebSocket hub for real-time messaging
import type { Message, WsMessage, WsMessageType } from './types.js';
import { log } from '../../shared/middleware/logger.js';

type WebSocketClient = {
  send: (data: string) => void;
  readyState: number;
};

// Hub manages WebSocket connections per ticket
const clients: Map<string, Set<WebSocketClient>> = new Map();

export const addClient = (ticketId: string, client: WebSocketClient): void => {
  if (!clients.has(ticketId)) {
    clients.set(ticketId, new Set());
  }
  clients.get(ticketId)!.add(client);
  log.info(`WebSocket client added for ticket ${ticketId}`);
};

export const removeClient = (ticketId: string, client: WebSocketClient): void => {
  const ticketClients = clients.get(ticketId);
  if (ticketClients) {
    ticketClients.delete(client);
    if (ticketClients.size === 0) {
      clients.delete(ticketId);
    }
    log.info(`WebSocket client removed for ticket ${ticketId}`);
  }
};

export const broadcast = (ticketId: string, type: WsMessageType, message: Message): void => {
  const ticketClients = clients.get(ticketId);
  if (!ticketClients) return;

  const wsMessage: WsMessage = { type, data: message };
  const payload = JSON.stringify(wsMessage);

  for (const client of ticketClients) {
    if (client.readyState === 1) { // OPEN state
      try {
        client.send(payload);
      } catch (err) {
        log.warn(`Failed to send WebSocket message: ${err}`);
      }
    }
  }
};

export const broadcastNewMessage = (message: Message): void => {
  broadcast(message.ticket_id, 'new_message', message);
};

export const broadcastUpdateMessage = (message: Message): void => {
  broadcast(message.ticket_id, 'update_message', message);
};

export const broadcastDeleteMessage = (message: Message): void => {
  broadcast(message.ticket_id, 'delete_message', message);
};

export const broadcastPinMessage = (message: Message): void => {
  broadcast(message.ticket_id, 'pin_message', message);
};

export const getConnectionCount = (ticketId: string): number => {
  return clients.get(ticketId)?.size || 0;
};

export const getTotalConnections = (): number => {
  let total = 0;
  for (const ticketClients of clients.values()) {
    total += ticketClients.size;
  }
  return total;
};

