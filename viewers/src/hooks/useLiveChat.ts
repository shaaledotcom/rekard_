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
 *    - Appends new messages from WebSocket to end of list (newest at bottom)
 *    - Maintains cursor for pagination
 *    - Tracks pagination state (hasMore, loadingMore)
 * 
 * 3. PAGINATION:
 *    - Loads older messages when scrolling to top
 *    - Uses cursor-based pagination for efficient loading
 *    - Prepends older messages to beginning of list (preserves scroll position)
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
    if (latestMessages && latestMessages.length > 0) {
      setMessages(latestMessages);
      setCursor(latestMessages[latestMessages.length - 1]?.created_at);
      setHasMore(latestMessages.length === PAGE_SIZE);
    } else if (!isLoading && latestMessages && latestMessages.length === 0) {
      setMessages([]);
      setHasMore(false);
    }
  }, [latestMessages, isLoading]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (!ticketId) return;

    // Build WebSocket URL from API config
    const getWebSocketUrl = (): string => {
      // Use NEXT_PUBLIC_WS_URL if explicitly set, otherwise derive from API URL
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
      if (wsUrl) {
        return `${wsUrl}?ticket_id=${ticketId}`;
      }

      // Derive WebSocket URL from API URL
      const apiUrl = config.apiUrl;
      try {
        const url = new URL(apiUrl);
        // Use wss:// for https://, ws:// for http://
        const wsProtocol = url.protocol === "https:" ? "wss" : "ws";
        const wsHost = url.host;
        return `${wsProtocol}://${wsHost}/api/v1/chat/ws?ticket_id=${ticketId}`;
      } catch {
        // Fallback: use current window location
        const wsProtocol = window.location.protocol === "https:" ? "wss" : "ws";
        const wsHost = window.location.host;
        return `${wsProtocol}://${wsHost}/api/v1/chat/ws?ticket_id=${ticketId}`;
      }
    };

    const wsUrl = getWebSocketUrl();

    let ws: WebSocket;
    
    try {
      ws = new WebSocket(wsUrl);
    } catch (error) {
      return;
    }

    ws.onmessage = (event) => {
      try {
        const wsMsg = JSON.parse(event.data);
        
        // Handle connection confirmation
        if (wsMsg.type === 'connected') {
          return;
        }
        
        // Handle pong response
        if (wsMsg.type === 'pong') {
          return;
        }
        
        // Handle chat messages (new_message, update_message, delete_message, pin_message)
        if (wsMsg.data && wsMsg.data.id) {
          const msg = wsMsg.data;
          
          setMessages((prev) => {
            // Prevent duplicate messages
            if (prev.some((m) => m.id === msg.id)) {
              // Update existing message if it's an update/pin
              if (wsMsg.type === 'update_message' || wsMsg.type === 'pin_message') {
                return prev.map((m) => (m.id === msg.id ? msg : m));
              }
              return prev;
            }
            
            // Handle different message types
            if (wsMsg.type === 'delete_message') {
              return prev.filter((m) => m.id !== msg.id);
            } else if (wsMsg.type === 'update_message' || wsMsg.type === 'pin_message') {
              return prev.map((m) => (m.id === msg.id ? msg : m));
            } else if (wsMsg.type === 'new_message') {
              return [...prev, msg];
            }
            
            return prev;
          });
          
          // Auto-scroll to bottom when new message arrives
          if (wsMsg.type === 'new_message') {
            setAutoScroll(true);
          }
        }
      } catch (e) {
        // Silently handle parse errors
      }
    };

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
    if (autoScroll && messagesContainerRef.current) {
      setTimeout(() => {
        const container = messagesContainerRef.current;
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      }, 100);
    }
  }, [messages, autoScroll]);

  // Load older messages (pagination)
  const loadOlderMessages = useCallback(async () => {
    if (!hasMore || loadingMore || !cursor) return;
    setLoadingMore(true);

    try {
      const container = messagesContainerRef.current;
      const previousScrollHeight = container?.scrollHeight || 0;
      const previousScrollTop = container?.scrollTop || 0;

      const res = await fetch(
        `${config.apiUrl}/v1/viewer/chat/messages?ticket_id=${ticketId}&limit=${PAGE_SIZE}&cursor=${encodeURIComponent(cursor)}`
      );
      const json = await res.json();
      const older: ChatMessage[] = json.data || [];
      // Prepend older messages to top (they're older, so should appear before current messages)
      setMessages((prev) => [...older, ...prev]);
      setCursor(older[older.length - 1]?.created_at);
      setHasMore(older.length === PAGE_SIZE);

      // Preserve scroll position after prepending older messages
      if (container) {
        setTimeout(() => {
          const newScrollHeight = container.scrollHeight;
          const heightDifference = newScrollHeight - previousScrollHeight;
          container.scrollTop = previousScrollTop + heightDifference;
        }, 0);
      }
    } catch (e) {
      // Silently handle errors
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
      const sentMessage = await postMessage({
        ticket_id: ticketId,
        content: newMessage,
        username: username.trim() || undefined,
      }).unwrap();
      
      // The message should come via WebSocket, but add it optimistically if needed
      setMessages((prev) => {
        // Check if message already exists (from WebSocket)
        if (prev.some((m) => m.id === sentMessage.id)) return prev;
        // Add to end (will be reversed for display)
        return [...prev, sentMessage];
      });
      
      setNewMessage("");
      setAutoScroll(true);
    } catch (e) {
      // Silently handle errors
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
        // Silently handle errors
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
        // Silently handle errors
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
        // Silently handle errors
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

  return {
    // State
    newMessage,
    setNewMessage,
    username,
    setUsername,
    editingId,
    editingContent,
    setEditingContent,
    messages,
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

