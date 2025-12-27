"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Send,
  Edit2,
  Trash2,
  Pin,
  PinOff,
  Check,
  X,
  Loader2,
  User,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  useGetMessagesQuery,
  usePostMessageMutation,
  useUpdateMessageMutation,
  useDeleteMessageMutation,
  usePinMessageMutation,
} from "@/store/api";
import type { ChatMessage } from "@/store/api";
import { useTimezoneFormat } from "@/hooks/useTimezoneFormat";
import { config } from "@/lib/config";

interface LiveChatSectionProps {
  ticketId: string;
  userId?: string;
}

const PAGE_SIZE = 30;

const LiveChatSection: React.FC<LiveChatSectionProps> = ({
  ticketId,
  userId,
}) => {
  const [newMessage, setNewMessage] = useState("");
  const [username, setUsername] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [autoScroll, setAutoScroll] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { formatRelativeTime } = useTimezoneFormat();

  const {
    data: latestMessages = [],
    isLoading,
    refetch,
  } = useGetMessagesQuery({ ticket_id: ticketId, limit: PAGE_SIZE });

  const [postMessage, { isLoading: isSending }] = usePostMessageMutation();
  const [updateMessage] = useUpdateMessageMutation();
  const [deleteMessage] = useDeleteMessageMutation();
  const [pinMessage] = usePinMessageMutation();

  // Load saved username
  useEffect(() => {
    const savedUsername = localStorage.getItem(`chat_username_${ticketId}`);
    if (savedUsername) {
      setUsername(savedUsername);
    }
  }, [ticketId]);

  // Sync messages from query
  useEffect(() => {
    if (latestMessages.length > 0) {
      setMessages(latestMessages);
      setCursor(latestMessages[latestMessages.length - 1]?.created_at);
      setHasMore(latestMessages.length === PAGE_SIZE);
    }
  }, [latestMessages]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    const wsProtocol = window.location.protocol === "https:" ? "wss" : "ws";
    const wsHost =
      process.env.NODE_ENV === "development"
        ? "localhost:9999"
        : window.location.host;
    const wsUrl = `${wsProtocol}://${wsHost}/api/v1/chat/ws?ticket_id=${ticketId}`;

    console.log("[Chat] Connecting to websocket:", wsUrl);
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => console.log("[Chat] WebSocket open");
    ws.onmessage = (event) => {
      console.log("[Chat] WebSocket message:", event.data);
      try {
        const msg = JSON.parse(event.data);
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [msg, ...prev];
        });
      } catch (e) {
        console.error("[Chat] Failed to parse message:", e);
      }
    };
    ws.onerror = (e) => console.error("[Chat] WebSocket error", e);
    ws.onclose = (e) => console.log("[Chat] WebSocket closed", e);

    // Ping to keep connection alive
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "ping" }));
      }
    }, 20000);

    return () => {
      clearInterval(pingInterval);
      ws.close();
    };
  }, [ticketId]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScroll) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [messages, autoScroll]);

  const loadOlderMessages = useCallback(async () => {
    if (!hasMore || loadingMore || !cursor) return;
    setLoadingMore(true);

    try {
      const res = await fetch(
        `${config.apiUrl}/v1/viewer/chat/messages?ticket_id=${ticketId}&limit=${PAGE_SIZE}&cursor=${encodeURIComponent(cursor)}`
      );
      const json = await res.json();
      const older: ChatMessage[] = json.data || [];
      setMessages((prev) => [...prev, ...older]);
      setCursor(older[older.length - 1]?.created_at);
      setHasMore(older.length === PAGE_SIZE);
    } catch (e) {
      console.error("[Chat] Failed to load older messages:", e);
    }
    setLoadingMore(false);
  }, [ticketId, cursor, hasMore, loadingMore]);

  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    if (
      messagesContainerRef.current.scrollTop === 0 &&
      hasMore &&
      !loadingMore
    ) {
      loadOlderMessages();
    }
    if (
      messagesContainerRef.current.scrollTop <
      messagesContainerRef.current.scrollHeight -
        messagesContainerRef.current.clientHeight -
        100
    ) {
      setAutoScroll(false);
    } else {
      setAutoScroll(true);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    if (username.trim()) {
      localStorage.setItem(`chat_username_${ticketId}`, username.trim());
    }
    try {
      await postMessage({
        ticket_id: ticketId,
        content: newMessage,
        username: username.trim() || undefined,
      });
      setNewMessage("");
      setAutoScroll(true);
    } catch (e) {
      console.error("[Chat] Failed to send message:", e);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (editingId) {
        handleEditSave(editingId);
      } else {
        handleSendMessage();
      }
    }
  };

  const isOwnMessage = (msg: ChatMessage) => {
    if (userId && msg.user_id) return userId === msg.user_id;
    return false;
  };

  const handleEdit = (msg: ChatMessage) => {
    setEditingId(msg.id);
    setEditingContent(msg.content);
  };

  const handleEditSave = async (id: number) => {
    if (!editingContent.trim()) return;
    try {
      await updateMessage({ id, content: editingContent, ticket_id: ticketId });
      setEditingId(null);
      setEditingContent("");
    } catch (e) {
      console.error("[Chat] Failed to update message:", e);
    }
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditingContent("");
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMessage({ id, ticket_id: ticketId });
    } catch (e) {
      console.error("[Chat] Failed to delete message:", e);
    }
  };

  const handlePin = async (id: number, isPinned: boolean) => {
    try {
      await pinMessage({ id, is_pinned: !isPinned, ticket_id: ticketId });
    } catch (e) {
      console.error("[Chat] Failed to pin message:", e);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return formatRelativeTime(timestamp);
  };

  const orderedMessages = [...messages].reverse();

  return (
    <div className="bg-card rounded-lg border p-4 h-[var(--video-height,500px)] flex flex-col w-full min-h-0">
      <h3 className="text-lg font-semibold mb-4 flex-shrink-0">LIVE CHAT</h3>
      <div
        className="flex-1 overflow-y-auto space-y-4 min-h-0 relative"
        ref={messagesContainerRef}
        onScroll={handleScroll}
        style={{ scrollBehavior: "smooth" }}
      >
        {loadingMore && (
          <div className="absolute top-0 left-0 w-full flex justify-center z-10">
            <Loader2 className="animate-spin h-5 w-5 text-muted-foreground" />
          </div>
        )}
        {isLoading && messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <p className="text-sm">Loading chat...</p>
          </div>
        ) : orderedMessages.length > 0 ? (
          orderedMessages.map((msg) => (
            <div key={msg.id} className="flex gap-3 group">
              <div className="h-8 w-8 flex-shrink-0 flex items-center justify-center bg-muted rounded-full">
                <User className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">
                    {msg.username || "Anonymous"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatTimestamp(msg.created_at)}
                  </span>
                  {msg.is_pinned && (
                    <span className="ml-2 text-xs text-primary font-bold">
                      PINNED
                    </span>
                  )}
                  <div className="ml-auto flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {isOwnMessage(msg) && editingId !== msg.id && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => handleEdit(msg)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    )}
                    {isOwnMessage(msg) && editingId !== msg.id && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => handleDelete(msg.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => handlePin(msg.id, msg.is_pinned)}
                    >
                      {msg.is_pinned ? (
                        <PinOff className="h-4 w-4 text-primary" />
                      ) : (
                        <Pin className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                {editingId === msg.id ? (
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="flex-1"
                      autoFocus={true}
                      autoComplete="off"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEditSave(msg.id)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={handleEditCancel}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm mt-1 break-words">{msg.content}</p>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <p className="text-sm">No messages yet. Be the first to chat!</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="flex flex-col gap-2 mt-4 flex-shrink-0">
        <Input
          placeholder="Enter your name (optional)"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="text-sm"
          disabled={isSending}
        />
        <div className="flex gap-2 items-end">
          <Input
            ref={inputRef}
            placeholder="Type a message..."
            value={editingId ? editingContent : newMessage}
            onChange={(e) =>
              editingId
                ? setEditingContent(e.target.value)
                : setNewMessage(e.target.value)
            }
            onKeyPress={handleKeyPress}
            className="flex-1"
            disabled={isSending}
          />
          {!editingId && (
            <Button
              size="icon"
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || isSending}
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveChatSection;

