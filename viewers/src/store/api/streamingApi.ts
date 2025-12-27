import { api } from "./baseApi";

// Types for streaming
export interface StreamingSession {
  session_id: number;
  session_token: string;
  ticket_id: number;
  event_id?: number;
  user_id: string;
  user_email: string;
  user_name?: string;
  started_at: string;
  expires_at: number;
  order_status: string;
  order_number: string;
}

export interface StreamingStats {
  order_id: number;
  ticket_id: number;
  event_id?: number;
  active_viewers: number;
  max_concurrent: number;
  available_slots: number;
}

export interface CreateStreamingSessionRequest {
  order_id: number;
  ticket_id: number;
  event_id?: number;
  user_email?: string;
  user_name?: string;
}

export interface ValidateSessionResponse {
  session_id: number;
  session_token: string;
  ticket_id: number;
  event_id?: number;
  user_id: string;
  user_email: string;
  user_name?: string;
  started_at: string;
  expires_at: number;
  order_status: string;
  order_number: string;
}

export interface HeartbeatResponse {
  session_id: number;
  last_activity_at: number;
}

// Wrapper type for API responses
interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export const streamingApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Create streaming session
    createStreamingSession: builder.mutation<
      StreamingSession,
      CreateStreamingSessionRequest
    >({
      query: (data) => ({
        url: "/v1/viewer/streaming/sessions",
        method: "POST",
        body: data,
      }),
      transformResponse: (response: ApiResponse<StreamingSession>) =>
        response.data,
    }),

    // Validate streaming session
    validateStreamingSession: builder.query<
      ValidateSessionResponse,
      { sessionToken: string; eventId?: number }
    >({
      query: ({ sessionToken, eventId }) => ({
        url: "/v1/viewer/streaming/sessions/validate",
        method: "POST",
        body: { session_token: sessionToken, event_id: eventId },
      }),
      transformResponse: (response: ApiResponse<ValidateSessionResponse>) =>
        response.data,
    }),

    // Send heartbeat
    sendHeartbeat: builder.mutation<HeartbeatResponse, { sessionToken: string }>(
      {
        query: ({ sessionToken }) => ({
          url: "/v1/viewer/streaming/heartbeat",
          method: "POST",
          params: { session_token: sessionToken },
        }),
        transformResponse: (response: ApiResponse<HeartbeatResponse>) =>
          response.data,
      }
    ),

    // End streaming session
    endStreamingSession: builder.mutation<void, { sessionToken: string }>({
      query: ({ sessionToken }) => ({
        url: "/v1/viewer/streaming/end",
        method: "POST",
        params: { session_token: sessionToken },
      }),
    }),

    // Get streaming stats
    getStreamingStats: builder.query<
      StreamingStats,
      { orderId: number; ticketId: number; eventId?: number }
    >({
      query: ({ orderId, ticketId, eventId }) => ({
        url: "/v1/viewer/streaming/stats",
        params: { order_id: orderId, ticket_id: ticketId, event_id: eventId },
      }),
      transformResponse: (response: ApiResponse<StreamingStats>) =>
        response.data,
    }),

    // Get user's active sessions
    getMyStreamingSessions: builder.query<StreamingSession[], void>({
      query: () => "/v1/viewer/streaming/my-sessions",
      transformResponse: (response: ApiResponse<StreamingSession[]>) =>
        response.data,
    }),
  }),
});

export const {
  useCreateStreamingSessionMutation,
  useValidateStreamingSessionQuery,
  useSendHeartbeatMutation,
  useEndStreamingSessionMutation,
  useGetStreamingStatsQuery,
  useGetMyStreamingSessionsQuery,
} = streamingApi;

