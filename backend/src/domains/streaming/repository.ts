// Streaming repository - tenant-aware database operations using Drizzle ORM
import { eq, and, lt, desc, count } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { db, streamingSessions } from '../../db/index';
import type {
  StreamingSession,
  SessionStatus,
  CreateStreamingSessionRequest,
  UpdateStreamingSessionRequest,
  StreamingSessionFilter,
  StreamingSessionListResponse,
  PaginationParams,
} from './types';

const generateSessionToken = (): string => {
  return randomBytes(32).toString('hex');
};

// Transform database row to API response format
const transformSession = (session: typeof streamingSessions.$inferSelect): StreamingSession => {
  return {
    id: session.id,
    app_id: session.appId,
    tenant_id: session.tenantId,
    order_id: session.orderId ?? 0,
    ticket_id: session.ticketId,
    event_id: session.eventId ?? undefined,
    user_id: session.userId,
    user_email: session.userEmail ?? '',
    user_name: session.userName ?? undefined,
    session_token: session.sessionToken,
    ip_address: session.ipAddress ?? '',
    user_agent: session.userAgent ?? '',
    status: (session.status as SessionStatus) ?? 'active',
    started_at: session.startedAt,
    last_activity_at: session.lastActivityAt,
    ended_at: session.endedAt ?? undefined,
    metadata: {},
    created_at: session.startedAt,
    updated_at: session.lastActivityAt,
  };
};

export const createSession = async (
  appId: string,
  tenantId: string,
  data: CreateStreamingSessionRequest
): Promise<StreamingSession> => {
  const now = new Date();
  
  const [session] = await db
    .insert(streamingSessions)
    .values({
      appId,
      tenantId,
      sessionToken: generateSessionToken(),
      orderId: data.order_id,
      ticketId: data.ticket_id,
      eventId: data.event_id,
      userId: data.user_id,
      userEmail: data.user_email,
      userName: data.user_name,
      ipAddress: data.ip_address,
      userAgent: data.user_agent,
      status: 'active',
      startedAt: now,
      lastActivityAt: now,
    })
    .returning();

  return transformSession(session);
};

export const getSessionById = async (
  appId: string,
  tenantId: string,
  sessionId: number
): Promise<StreamingSession | null> => {
  const [session] = await db
    .select()
    .from(streamingSessions)
    .where(
      and(
        eq(streamingSessions.appId, appId),
        eq(streamingSessions.tenantId, tenantId),
        eq(streamingSessions.id, sessionId)
      )
    )
    .limit(1);

  return session ? transformSession(session) : null;
};

export const getSessionByToken = async (
  sessionToken: string
): Promise<StreamingSession | null> => {
  const [session] = await db
    .select()
    .from(streamingSessions)
    .where(eq(streamingSessions.sessionToken, sessionToken))
    .limit(1);

  return session ? transformSession(session) : null;
};

export const updateSession = async (
  sessionId: number,
  data: UpdateStreamingSessionRequest
): Promise<StreamingSession | null> => {
  const updates: Partial<typeof streamingSessions.$inferInsert> = {};

  if (data.status !== undefined) updates.status = data.status;
  if (data.last_activity_at !== undefined) updates.lastActivityAt = data.last_activity_at;
  if (data.ended_at !== undefined) updates.endedAt = data.ended_at;
  if (data.ip_address !== undefined) updates.ipAddress = data.ip_address;
  if (data.user_agent !== undefined) updates.userAgent = data.user_agent;

  const [session] = await db
    .update(streamingSessions)
    .set(updates)
    .where(eq(streamingSessions.id, sessionId))
    .returning();

  return session ? transformSession(session) : null;
};

export const getActiveSessionsByOrder = async (
  appId: string,
  tenantId: string,
  orderId: number
): Promise<StreamingSession[]> => {
  const sessions = await db
    .select()
    .from(streamingSessions)
    .where(
      and(
        eq(streamingSessions.appId, appId),
        eq(streamingSessions.tenantId, tenantId),
        eq(streamingSessions.orderId, orderId),
        eq(streamingSessions.status, 'active')
      )
    );

  return sessions.map(transformSession);
};

export const getActiveSessionsCountByOrder = async (
  appId: string,
  tenantId: string,
  orderId: number
): Promise<number> => {
  const [result] = await db
    .select({ count: count() })
    .from(streamingSessions)
    .where(
      and(
        eq(streamingSessions.appId, appId),
        eq(streamingSessions.tenantId, tenantId),
        eq(streamingSessions.orderId, orderId),
        eq(streamingSessions.status, 'active')
      )
    );

  return result?.count || 0;
};

export const getPreviousSessionByBrowser = async (
  appId: string,
  tenantId: string,
  orderId: number,
  ipAddress: string,
  userAgent: string
): Promise<StreamingSession | null> => {
  const [session] = await db
    .select()
    .from(streamingSessions)
    .where(
      and(
        eq(streamingSessions.appId, appId),
        eq(streamingSessions.tenantId, tenantId),
        eq(streamingSessions.orderId, orderId),
        eq(streamingSessions.ipAddress, ipAddress),
        eq(streamingSessions.userAgent, userAgent),
        eq(streamingSessions.status, 'active')
      )
    )
    .orderBy(desc(streamingSessions.startedAt))
    .limit(1);

  return session ? transformSession(session) : null;
};

export const listSessions = async (
  appId: string,
  tenantId: string,
  filter: StreamingSessionFilter = {},
  pagination: PaginationParams = {}
): Promise<StreamingSessionListResponse> => {
  const page = Math.max(1, pagination.page || 1);
  const pageSize = Math.max(1, Math.min(100, pagination.page_size || 10));
  const offset = (page - 1) * pageSize;

  const conditions = [
    eq(streamingSessions.appId, appId),
    eq(streamingSessions.tenantId, tenantId),
  ];

  if (filter.order_id) {
    conditions.push(eq(streamingSessions.orderId, filter.order_id));
  }
  if (filter.ticket_id) {
    conditions.push(eq(streamingSessions.ticketId, filter.ticket_id));
  }
  if (filter.event_id) {
    conditions.push(eq(streamingSessions.eventId, filter.event_id));
  }
  if (filter.user_id) {
    conditions.push(eq(streamingSessions.userId, filter.user_id));
  }
  if (filter.status) {
    conditions.push(eq(streamingSessions.status, filter.status));
  }
  if (filter.active_only) {
    conditions.push(eq(streamingSessions.status, 'active'));
  }

  const [countResult] = await db
    .select({ count: count() })
    .from(streamingSessions)
    .where(and(...conditions));

  const total = countResult?.count || 0;

  const data = await db
    .select()
    .from(streamingSessions)
    .where(and(...conditions))
    .orderBy(desc(streamingSessions.startedAt))
    .limit(pageSize)
    .offset(offset);

  return {
    data: data.map(transformSession),
    total,
    page,
    page_size: pageSize,
    total_pages: Math.ceil(total / pageSize),
  };
};

export const getUserActiveSessions = async (
  appId: string,
  tenantId: string,
  userId: string
): Promise<StreamingSession[]> => {
  const sessions = await db
    .select()
    .from(streamingSessions)
    .where(
      and(
        eq(streamingSessions.appId, appId),
        eq(streamingSessions.tenantId, tenantId),
        eq(streamingSessions.userId, userId),
        eq(streamingSessions.status, 'active')
      )
    );

  return sessions.map(transformSession);
};

export const expireStaleSessionsForOrder = async (
  appId: string,
  tenantId: string,
  orderId: number,
  heartbeatTimeoutSeconds: number = 15
): Promise<number> => {
  const cutoffTime = new Date(Date.now() - heartbeatTimeoutSeconds * 1000);

  const result = await db
    .update(streamingSessions)
    .set({
      status: 'expired',
      endedAt: new Date(),
    })
    .where(
      and(
        eq(streamingSessions.appId, appId),
        eq(streamingSessions.tenantId, tenantId),
        eq(streamingSessions.orderId, orderId),
        eq(streamingSessions.status, 'active'),
        lt(streamingSessions.lastActivityAt, cutoffTime)
      )
    )
    .returning({ id: streamingSessions.id });

  return result.length;
};

export const endSession = async (sessionId: number): Promise<boolean> => {
  const result = await db
    .update(streamingSessions)
    .set({
      status: 'ended',
      endedAt: new Date(),
    })
    .where(eq(streamingSessions.id, sessionId))
    .returning({ id: streamingSessions.id });

  return result.length > 0;
};

export const updateHeartbeat = async (sessionId: number): Promise<boolean> => {
  const result = await db
    .update(streamingSessions)
    .set({
      lastActivityAt: new Date(),
    })
    .where(
      and(
        eq(streamingSessions.id, sessionId),
        eq(streamingSessions.status, 'active')
      )
    )
    .returning({ id: streamingSessions.id });

  return result.length > 0;
};
