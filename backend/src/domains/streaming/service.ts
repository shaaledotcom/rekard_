// Streaming service - business logic
import * as repo from './repository.js';
import * as eventsRepo from '../events/repository.js';
import * as ordersRepo from '../orders/repository.js';
import type {
  StreamingSession,
  CreateStreamingSessionRequest,
  StreamingSessionFilter,
  StreamingSessionListResponse,
  PaginationParams,
  ValidateSessionResult,
  CreateSessionResponse,
} from './types.js';
import { log } from '../../shared/middleware/logger.js';
import { badRequest, notFound, forbidden } from '../../shared/errors/app-error.js';

const DEFAULT_MAX_CONCURRENT = 2;
const HEARTBEAT_TIMEOUT_SECONDS = 15;
const SESSION_EXPIRY_MINUTES = 30;

// Create streaming session with concurrency check
export const createStreamingSession = async (
  appId: string,
  tenantId: string,
  data: CreateStreamingSessionRequest
): Promise<CreateSessionResponse> => {
  // Validate required fields
  if (!data.order_id) {
    throw badRequest('Order ID is required');
  }
  if (!data.ticket_id) {
    throw badRequest('Ticket ID is required');
  }
  if (!data.user_id) {
    throw badRequest('User ID is required');
  }

  // Validate order exists and is completed
  const order = await ordersRepo.getOrderByUserId(appId, tenantId, data.user_id, data.order_id);
  if (!order) {
    throw notFound('Order');
  }
  if (order.status !== 'completed') {
    throw badRequest('Order is not completed');
  }

  // Cleanup expired sessions
  await repo.expireStaleSessionsForOrder(appId, tenantId, data.order_id, HEARTBEAT_TIMEOUT_SECONDS);

  // Check for existing session from same browser
  const previousSession = await repo.getPreviousSessionByBrowser(
    appId,
    tenantId,
    data.order_id,
    data.ip_address,
    data.user_agent
  );

  // Get active session count
  const activeCount = await repo.getActiveSessionsCountByOrder(appId, tenantId, data.order_id);

  // Determine max concurrent viewers
  let maxConcurrent = DEFAULT_MAX_CONCURRENT;
  if (data.event_id) {
    const event = await eventsRepo.getEventById(appId, tenantId, data.event_id);
    if (event && event.max_concurrent_viewers_per_link > 0) {
      maxConcurrent = event.max_concurrent_viewers_per_link;
    }
  }

  // Check concurrency limit
  if (activeCount >= maxConcurrent && !previousSession) {
    throw forbidden(`Maximum concurrent viewers (${maxConcurrent}) reached for this link`);
  }

  // Create new session
  const session = await repo.createSession(appId, tenantId, data);

  log.info(`Created streaming session ${session.id} for order ${data.order_id}`);

  return {
    session_token: session.session_token,
    expires_at: Date.now() + SESSION_EXPIRY_MINUTES * 60 * 1000,
  };
};

// Validate streaming session
export const validateSession = async (
  sessionToken: string
): Promise<ValidateSessionResult> => {
  const session = await repo.getSessionByToken(sessionToken);

  if (!session) {
    return { valid: false, error: 'Session not found' };
  }

  if (session.status !== 'active') {
    return { valid: false, error: 'Session is not active' };
  }

  // Check if session is stale
  const lastActivity = new Date(session.last_activity_at);
  const now = new Date();
  const secondsSinceActivity = (now.getTime() - lastActivity.getTime()) / 1000;

  if (secondsSinceActivity > HEARTBEAT_TIMEOUT_SECONDS * 2) {
    await repo.updateSession(session.id, { status: 'expired', ended_at: now });
    return { valid: false, error: 'Session expired due to inactivity' };
  }

  return { valid: true, session };
};

// Get session by token
export const getSessionByToken = async (
  sessionToken: string
): Promise<StreamingSession> => {
  const session = await repo.getSessionByToken(sessionToken);
  if (!session) {
    throw notFound('Session');
  }
  return session;
};

// Update heartbeat
export const heartbeat = async (sessionToken: string): Promise<boolean> => {
  const session = await repo.getSessionByToken(sessionToken);
  if (!session) {
    throw notFound('Session');
  }

  if (session.status !== 'active') {
    throw badRequest('Session is not active');
  }

  return repo.updateHeartbeat(session.id);
};

// End session
export const endSession = async (sessionToken: string): Promise<void> => {
  const session = await repo.getSessionByToken(sessionToken);
  if (!session) {
    throw notFound('Session');
  }

  await repo.endSession(session.id);
  log.info(`Ended streaming session ${session.id}`);
};

// List sessions (admin)
export const listSessions = async (
  appId: string,
  tenantId: string,
  filter: StreamingSessionFilter = {},
  pagination: PaginationParams = {}
): Promise<StreamingSessionListResponse> => {
  return repo.listSessions(appId, tenantId, filter, pagination);
};

// Get user's active sessions
export const getUserActiveSessions = async (
  appId: string,
  tenantId: string,
  userId: string
): Promise<StreamingSession[]> => {
  return repo.getUserActiveSessions(appId, tenantId, userId);
};

// Get active sessions for order
export const getOrderActiveSessions = async (
  appId: string,
  tenantId: string,
  orderId: number
): Promise<StreamingSession[]> => {
  return repo.getActiveSessionsByOrder(appId, tenantId, orderId);
};

// Force end all sessions for order
export const forceEndOrderSessions = async (
  appId: string,
  tenantId: string,
  orderId: number
): Promise<number> => {
  const sessions = await repo.getActiveSessionsByOrder(appId, tenantId, orderId);
  let endedCount = 0;

  for (const session of sessions) {
    const ended = await repo.endSession(session.id);
    if (ended) endedCount++;
  }

  log.info(`Force ended ${endedCount} sessions for order ${orderId}`);
  return endedCount;
};

// Get streaming stats for an order
export const getStreamingStats = async (
  appId: string,
  tenantId: string,
  orderId: number,
  ticketId: number,
  eventId?: number
): Promise<{
  order_id: number;
  ticket_id: number;
  event_id?: number;
  active_viewers: number;
  max_concurrent: number;
  available_slots: number;
}> => {
  // Cleanup expired sessions first
  await repo.expireStaleSessionsForOrder(appId, tenantId, orderId, HEARTBEAT_TIMEOUT_SECONDS);

  // Get active session count for this order
  const activeCount = await repo.getActiveSessionsCountByOrder(appId, tenantId, orderId);

  // Get max concurrent limit from event settings
  let maxConcurrent = DEFAULT_MAX_CONCURRENT;
  if (eventId) {
    const event = await eventsRepo.getEventById(appId, tenantId, eventId);
    if (event && event.max_concurrent_viewers_per_link > 0) {
      maxConcurrent = event.max_concurrent_viewers_per_link;
    }
  }

  return {
    order_id: orderId,
    ticket_id: ticketId,
    event_id: eventId,
    active_viewers: activeCount,
    max_concurrent: maxConcurrent,
    available_slots: Math.max(0, maxConcurrent - activeCount),
  };
};

// Extract client info from request
export const extractClientInfo = (
  ip: string | undefined,
  userAgent: string | undefined
): { ip_address: string; user_agent: string } => {
  return {
    ip_address: ip || 'unknown',
    user_agent: userAgent || 'unknown',
  };
};

