import { api } from "./baseApi";

// Types for chat
export interface ChatMessage {
  id: number;
  ticket_id: string;
  user_id?: string;
  username: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateMessageRequest {
  ticket_id: string;
  content: string;
  username?: string;
}

export interface UpdateMessageRequest {
  content: string;
}

export interface GetMessagesParams {
  ticket_id: string;
  limit?: number;
  cursor?: string;
}

// Wrapper type for API responses
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const chatApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Get messages
    getMessages: builder.query<ChatMessage[], GetMessagesParams>({
      query: ({ ticket_id, limit = 30, cursor }) => ({
        url: "/v1/viewer/chat/messages",
        params: { ticket_id, limit, cursor },
      }),
      transformResponse: (response: ApiResponse<ChatMessage[]>) =>
        response.data,
      providesTags: (_result, _error, { ticket_id }) => [
        { type: "Chat", id: ticket_id },
      ],
    }),

    // Get pinned messages
    getPinnedMessages: builder.query<ChatMessage[], string>({
      query: (ticket_id) => ({
        url: "/v1/viewer/chat/messages/pinned",
        params: { ticket_id },
      }),
      transformResponse: (response: ApiResponse<{ messages: ChatMessage[] }>) =>
        response.data.messages,
      providesTags: (_result, _error, ticket_id) => [
        { type: "Chat", id: `pinned-${ticket_id}` },
      ],
    }),

    // Post message
    postMessage: builder.mutation<ChatMessage, CreateMessageRequest>({
      query: (data) => ({
        url: "/v1/viewer/chat/messages",
        method: "POST",
        body: data,
      }),
      transformResponse: (response: ApiResponse<ChatMessage>) => response.data,
      invalidatesTags: (_result, _error, { ticket_id }) => [
        { type: "Chat", id: ticket_id },
      ],
    }),

    // Update message
    updateMessage: builder.mutation<
      ChatMessage,
      { id: number; content: string; ticket_id: string }
    >({
      query: ({ id, content }) => ({
        url: `/v1/viewer/chat/messages/${id}`,
        method: "PATCH",
        body: { content },
      }),
      transformResponse: (response: ApiResponse<ChatMessage>) => response.data,
      invalidatesTags: (_result, _error, { ticket_id }) => [
        { type: "Chat", id: ticket_id },
      ],
    }),

    // Delete message
    deleteMessage: builder.mutation<void, { id: number; ticket_id: string }>({
      query: ({ id }) => ({
        url: `/v1/viewer/chat/messages/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { ticket_id }) => [
        { type: "Chat", id: ticket_id },
      ],
    }),

    // Pin/unpin message
    pinMessage: builder.mutation<
      ChatMessage,
      { id: number; is_pinned: boolean; ticket_id: string }
    >({
      query: ({ id, is_pinned }) => ({
        url: `/v1/viewer/chat/messages/${id}/pin`,
        method: "PATCH",
        body: { is_pinned },
      }),
      transformResponse: (response: ApiResponse<ChatMessage>) => response.data,
      invalidatesTags: (_result, _error, { ticket_id }) => [
        { type: "Chat", id: ticket_id },
        { type: "Chat", id: `pinned-${ticket_id}` },
      ],
    }),
  }),
});

export const {
  useGetMessagesQuery,
  useGetPinnedMessagesQuery,
  usePostMessageMutation,
  useUpdateMessageMutation,
  useDeleteMessageMutation,
  usePinMessageMutation,
} = chatApi;

