// Streaming domain types

export type StreamingSession = {
  id: number;
  app_id: string;
  tenant_id: string;
  session_token: string;
  order_id: number;
  ticket_id: number;
  event_id?: number;
  user_id: string;
  user_email: string;
  user_name?: string;
  ip_address: string;
  user_agent: string;
  status: SessionStatus;
  started_at: Date;
  last_activity_at: Date;
  ended_at?: Date;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
};

export type SessionStatus = 'active' | 'ended' | 'expired';

export type CreateStreamingSessionRequest = {
  order_id: number;
  ticket_id: number;
  event_id?: number;
  user_id: string;
  user_email: string;
  user_name?: string;
  ip_address: string;
  user_agent: string;
  metadata?: Record<string, unknown>;
};

export type UpdateStreamingSessionRequest = {
  status?: SessionStatus;
  last_activity_at?: Date;
  ended_at?: Date;
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, unknown>;
};

export type StreamingSessionFilter = {
  order_id?: number;
  ticket_id?: number;
  event_id?: number;
  user_id?: string;
  status?: SessionStatus;
  active_only?: boolean;
};

export type StreamingSessionListResponse = {
  data: StreamingSession[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

export type PaginationParams = {
  page?: number;
  page_size?: number;
};

// Session validation result
export type ValidateSessionResult = {
  valid: boolean;
  session?: StreamingSession;
  error?: string;
};

// Session creation response
export type CreateSessionResponse = {
  session_token: string;
  expires_at: number;
};

