// WebSocket route handler for chat
import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { URL } from 'url';
import * as chatWebSocket from '../../domains/chat/websocket.js';
import { log } from '../../shared/middleware/logger.js';

export const setupChatWebSocket = (server: any): void => {
  const wss = new WebSocketServer({ 
    server,
    path: '/api/v1/chat/ws',
    verifyClient: (info, callback) => {
      // Log connection attempt
      log.info(`WebSocket connection attempt from ${info.origin || 'unknown origin'}`);
      // Allow all origins in development, restrict in production if needed
      callback(true);
    }
  });

  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    let ticketId: string | null = null;

    try {
      // Parse ticket_id from query string
      const urlString = req.url || '';
      const url = new URL(urlString, `http://${req.headers.host || 'localhost'}`);
      ticketId = url.searchParams.get('ticket_id');

      if (!ticketId) {
        log.warn('WebSocket connection rejected: missing ticket_id');
        ws.close(1008, 'ticket_id is required');
        return;
      }

      log.info(`WebSocket connection established for ticket ${ticketId}`);
      
      // Add client to hub
      chatWebSocket.addClient(ticketId, ws);

      // Send initial connection confirmation
      ws.send(JSON.stringify({ type: 'connected', ticket_id: ticketId }));

      // Handle ping messages (keep-alive)
      ws.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          if (message.type === 'ping') {
            ws.send(JSON.stringify({ type: 'pong' }));
          }
        } catch (err) {
          // Ignore parse errors for non-JSON messages
        }
      });

      // Handle client disconnect
      ws.on('close', (code, reason) => {
        if (ticketId) {
          log.info(`WebSocket connection closed for ticket ${ticketId} (code: ${code}, reason: ${reason.toString()})`);
          chatWebSocket.removeClient(ticketId, ws);
        }
      });

      // Handle errors
      ws.on('error', (error) => {
        log.error(`WebSocket error for ticket ${ticketId || 'unknown'}:`, error);
        if (ticketId) {
          chatWebSocket.removeClient(ticketId, ws);
        }
      });
    } catch (error) {
      log.error('Error setting up WebSocket connection:', error);
      ws.close(1011, 'Internal server error');
    }
  });

  wss.on('error', (error) => {
    log.error('WebSocket server error:', error);
  });

  log.info('Chat WebSocket server initialized at /api/v1/chat/ws');
};

