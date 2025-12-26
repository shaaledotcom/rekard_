// Chat domain types

export type Message = {
  id: number;
  ticket_id: string;
  user_id: string;
  username: string;
  content: string;
  is_pinned: boolean;
  created_at: Date;
  updated_at: Date;
};

export type CreateMessageRequest = {
  ticket_id: string;
  content: string;
  username?: string;
};

export type UpdateMessageRequest = {
  content?: string;
  is_pinned?: boolean;
};

export type MessageFilter = {
  ticket_id: string;
  limit?: number;
  cursor?: Date;
};

export type MessagesResponse = {
  messages: Message[];
  has_more: boolean;
  next_cursor?: string;
};

// WebSocket message types
export type WsMessageType = 'new_message' | 'update_message' | 'delete_message' | 'pin_message';

export type WsMessage = {
  type: WsMessageType;
  data: Message;
};
