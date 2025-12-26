// Viewer streaming routes
import { Router, Response } from 'express';
import * as streamingService from '../../domains/streaming/service.js';
import type {
  CreateStreamingSessionRequest,
} from '../../domains/streaming/types.js';
import { requireSession } from '../../domains/auth/session.js';
import { tenantMiddleware, getTenantContext } from '../../shared/middleware/tenant.js';
import { ok, created, noContent, badRequest } from '../../shared/utils/response.js';
import type { AppRequest } from '../../shared/types/index.js';
import { asyncHandler } from '@/shared/index.js';

const router = Router();

// Apply middleware for protected routes
router.use(requireSession);
router.use(tenantMiddleware);

// Create streaming session
router.post('/sessions', asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  const { order_id, ticket_id, event_id, user_email, user_name } = req.body;

  if (!order_id) {
    return badRequest(res, 'Order ID is required');
  }
  if (!ticket_id) {
    return badRequest(res, 'Ticket ID is required');
  }

  const clientInfo = streamingService.extractClientInfo(
    req.ip || req.headers['x-forwarded-for'] as string,
    req.headers['user-agent']
  );

  const data: CreateStreamingSessionRequest = {
    order_id,
    ticket_id,
    event_id,
    user_id: tenant.userId,
    user_email: user_email || '',
    user_name,
    ip_address: clientInfo.ip_address,
    user_agent: clientInfo.user_agent,
  };

  const result = await streamingService.createStreamingSession(tenant.appId, tenant.tenantId, data);
  created(res, result, 'Streaming session created');
}));

// Validate session (POST with body or GET with query params)
router.post('/sessions/validate', asyncHandler(async (req: AppRequest, res: Response) => {
  const { session_token } = req.body;

  if (!session_token) {
    return badRequest(res, 'Session token is required');
  }

  const result = await streamingService.validateSession(session_token);
  ok(res, result);
}));

// Validate session (GET - for frontend compatibility)
router.get('/validate', asyncHandler(async (req: AppRequest, res: Response) => {
  const sessionToken = req.query.session_token as string;

  if (!sessionToken) {
    return badRequest(res, 'Session token is required');
  }

  const result = await streamingService.validateSession(sessionToken);
  ok(res, result);
}));

// Get session by token
router.get('/sessions/:token', asyncHandler(async (req: AppRequest, res: Response) => {
  const sessionToken = req.params.token;
  const session = await streamingService.getSessionByToken(sessionToken);
  ok(res, session);
}));

// Heartbeat (path param)
router.post('/sessions/:token/heartbeat', asyncHandler(async (req: AppRequest, res: Response) => {
  const sessionToken = req.params.token;
  const success = await streamingService.heartbeat(sessionToken);
  ok(res, { success });
}));

// Heartbeat (query param - for frontend compatibility)
router.post('/heartbeat', asyncHandler(async (req: AppRequest, res: Response) => {
  const sessionToken = req.query.session_token as string;

  if (!sessionToken) {
    return badRequest(res, 'Session token is required');
  }

  await streamingService.heartbeat(sessionToken);
  ok(res, { session_id: 0, last_activity_at: Date.now() }); // Match expected response format
}));

// End session (path param)
router.post('/sessions/:token/end', asyncHandler(async (req: AppRequest, res: Response) => {
  const sessionToken = req.params.token;
  await streamingService.endSession(sessionToken);
  noContent(res);
}));

// End session (query param - for frontend compatibility)
router.post('/end', asyncHandler(async (req: AppRequest, res: Response) => {
  const sessionToken = req.query.session_token as string;

  if (!sessionToken) {
    return badRequest(res, 'Session token is required');
  }

  await streamingService.endSession(sessionToken);
  ok(res, { session_id: 0, status: 'ended' }); // Match expected response format
}));

// Get streaming stats
router.get('/stats', asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  const orderId = parseInt(req.query.order_id as string, 10);
  const ticketId = parseInt(req.query.ticket_id as string, 10);
  const eventId = req.query.event_id ? parseInt(req.query.event_id as string, 10) : undefined;

  if (isNaN(orderId) || isNaN(ticketId)) {
    return badRequest(res, 'order_id and ticket_id are required');
  }

  const stats = await streamingService.getStreamingStats(
    tenant.appId,
    tenant.tenantId,
    orderId,
    ticketId,
    eventId
  );
  ok(res, stats);
}));

// Get user's active sessions
router.get('/my-sessions', asyncHandler(async (req: AppRequest, res: Response) => {
  const tenant = getTenantContext(req);
  const sessions = await streamingService.getUserActiveSessions(
    tenant.appId,
    tenant.tenantId,
    tenant.userId
  );
  ok(res, sessions);
}));

export const streamingRoutes: Router = router;

