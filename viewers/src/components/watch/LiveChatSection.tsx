"use client";

import React from "react";
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
import { useLiveChat } from "@/hooks/useLiveChat";

interface LiveChatSectionProps {
  ticketId: string;
  userId?: string;
}

const LiveChatSection: React.FC<LiveChatSectionProps> = ({
  ticketId,
  userId,
}) => {
  const {
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
    messagesEndRef,
    messagesContainerRef,
    inputRef,
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
  } = useLiveChat(ticketId, userId);

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
        ) : messages.length > 0 ? (
          messages.map((msg) => (
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

