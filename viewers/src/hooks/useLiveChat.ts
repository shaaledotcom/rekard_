import { useState, useRef, useEffect, useCallback } from "react";
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

const PAGE_SIZE = 30;

/**
 * Custom hook for LiveChatSection business logic
 * 
 * BUSINESS LOGIC OVERVIEW:
 * 
 * 1. REAL-TIME MESSAGING:
 *    - WebSocket connection for instant message updates
 *    - Auto-reconnects on ticket change
 *    - Ping mechanism (every 20s) to keep connection alive
 *    - Prevents duplicate messages by checking message IDs
 * 
 * 2. MESSAGE STATE MANAGEMENT:
 *    - Syncs initial messages from API query
 *    - Appends new messages from WebSocket to top of list
 *    - Maintains cursor for pagination
 *    - Tracks pagination state (hasMore, loadingMore)
 * 
 * 3. PAGINATION:
 *    - Loads older messages when scrolling to top
 *    - Uses cursor-based pagination for efficient loading
 *    - Appends older messages to bottom of list
 *    - Prevents duplicate loads with loading state guard
 * 
 * 4. AUTO-SCROLL BEHAVIOR:
 *    - Auto-scrolls to bottom when new messages arrive
 *    - Disables auto-scroll when user scrolls up
 *    - Re-enables when user scrolls near bottom
 *    - Smooth scroll animation for better UX
 * 
 * 5. MESSAGE OPERATIONS:
 *    - Create: Sends new message, saves username to localStorage
 *    - Update: Edits own messages inline
 *    - Delete: Removes own messages
 *    - Pin: Toggles pin status (available to all users)
 * 
 * 6. USERNAME PERSISTENCE:
 *    - Saves username to localStorage per ticket
 *    - Loads saved username on mount
 *    - Persists across page refreshes
 * 
 * 7. EDIT MODE:
 *    - Inline editing for own messages
 *    - Enter key submits, Escape cancels
 *    - Prevents editing multiple messages simultaneously
 */
export function useLiveChat(ticketId: string, userId?: string) {
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

  // Fetch initial messages
  const {
    data: latestMessages = [],
    isLoading,
  } = useGetMessagesQuery({ ticket_id: ticketId, limit: PAGE_SIZE });

  const [postMessage, { isLoading: isSending }] = usePostMessageMutation();
  const [updateMessage] = useUpdateMessageMutation();
  const [deleteMessage] = useDeleteMessageMutation();
  const [pinMessage] = usePinMessageMutation();

  // Load saved username from localStorage
  useEffect(() => {
    const savedUsername = localStorage.getItem(`chat_username_${ticketId}`);
    if (savedUsername) {
      setUsername(savedUsername);
    }
  }, [ticketId]);

  // Sync messages from API query
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
        // Prevent duplicate messages
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

    // Ping to keep connection alive (every 20 seconds)
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

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (autoScroll) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [messages, autoScroll]);

  // Load older messages (pagination)
  const loadOlderMessages = useCallback(async () => {
    if (!hasMore || loadingMore || !cursor) return;
    setLoadingMore(true);

    try {
      const res = await fetch(
        `${config.apiUrl}/v1/viewer/chat/messages?ticket_id=${ticketId}&limit=${PAGE_SIZE}&cursor=${encodeURIComponent(cursor)}`
      );
      const json = await res.json();
      const older: ChatMessage[] = json.data || [];
      // Append older messages to bottom
      setMessages((prev) => [...prev, ...older]);
      setCursor(older[older.length - 1]?.created_at);
      setHasMore(older.length === PAGE_SIZE);
    } catch (e) {
      console.error("[Chat] Failed to load older messages:", e);
    }
    setLoadingMore(false);
  }, [ticketId, cursor, hasMore, loadingMore]);

  // Handle scroll events for pagination and auto-scroll control
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;
    
    // Load older messages when scrolling to top
    if (
      messagesContainerRef.current.scrollTop === 0 &&
      hasMore &&
      !loadingMore
    ) {
      loadOlderMessages();
    }
    
    // Disable auto-scroll if user scrolls up, enable if near bottom
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
  }, [hasMore, loadingMore, loadOlderMessages]);

  // Send new message
  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim()) return;
    
    // Save username to localStorage
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
  }, [newMessage, username, ticketId, postMessage]);

  // Handle Enter key press
  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (editingId) {
          handleEditSave(editingId);
        } else {
          handleSendMessage();
        }
      }
    },
    [editingId, handleSendMessage]
  );

  // Check if message belongs to current user
  const isOwnMessage = useCallback(
    (msg: ChatMessage) => {
      if (userId && msg.user_id) return userId === msg.user_id;
      return false;
    },
    [userId]
  );

  // Start editing a message
  const handleEdit = useCallback((msg: ChatMessage) => {
    setEditingId(msg.id);
    setEditingContent(msg.content);
  }, []);

  // Save edited message
  const handleEditSave = useCallback(
    async (id: number) => {
      if (!editingContent.trim()) return;
      try {
        await updateMessage({
          id,
          content: editingContent,
          ticket_id: ticketId,
        });
        setEditingId(null);
        setEditingContent("");
      } catch (e) {
        console.error("[Chat] Failed to update message:", e);
      }
    },
    [editingContent, ticketId, updateMessage]
  );

  // Cancel editing
  const handleEditCancel = useCallback(() => {
    setEditingId(null);
    setEditingContent("");
  }, []);

  // Delete message
  const handleDelete = useCallback(
    async (id: number) => {
      try {
        await deleteMessage({ id, ticket_id: ticketId });
      } catch (e) {
        console.error("[Chat] Failed to delete message:", e);
      }
    },
    [ticketId, deleteMessage]
  );

  // Pin/unpin message
  const handlePin = useCallback(
    async (id: number, isPinned: boolean) => {
      try {
        await pinMessage({ id, is_pinned: !isPinned, ticket_id: ticketId });
      } catch (e) {
        console.error("[Chat] Failed to pin message:", e);
      }
    },
    [ticketId, pinMessage]
  );

  // Format timestamp for display
  const formatTimestamp = useCallback(
    (timestamp: string) => {
      return formatRelativeTime(timestamp);
    },
    [formatRelativeTime]
  );

  // Reverse messages for display (newest at bottom)
  const orderedMessages = [...messages].reverse();

  return {
    // State
    newMessage,
    setNewMessage,
    username,
    setUsername,
    editingId,
    editingContent,
    setEditingContent,
    messages: orderedMessages,
    isLoading,
    isSending,
    loadingMore,
    hasMore,
    autoScroll,

    // Refs
    messagesEndRef,
    messagesContainerRef,
    inputRef,

    // Handlers
    handleSendMessage,
    handleKeyPress,
    handleScroll,
    handleEdit,
    handleEditSave,
    handleEditCancel,
    handleDelete,
    handlePin,
    isOwnMessage,
    formatTimestamp,
  };
}

