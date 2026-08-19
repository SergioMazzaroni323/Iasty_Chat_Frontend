"use client";

import { Loader2, Copy, FileText, Pencil } from "lucide-react";
import { useState } from "react";
import { formatMessageTime, formatMessageTimeFull } from "@/lib/formatTime";
import { MarkdownContent } from "./MarkdownContent";
export interface DisplayMessage {
  id: number | string;
  role: "user" | "assistant";
  content: string;
  searchUrl?: string;
  isStreaming?: boolean;
  tokenCount?: number;
  createdAt?: string;
  attachmentName?: string;
}

interface MessageListProps {
  messages: DisplayMessage[];
  onEdit: (id: number | string, content: string) => void;
}

export function MessageList({ messages, onEdit }: MessageListProps) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
      {messages.map((msg) => (
        <MessageItem key={msg.id} message={msg} onEdit={onEdit} />
      ))}
    </div>
  );
}

function MessageItem({
  message,
  onEdit,
}: {
  message: DisplayMessage;
  onEdit: (id: number | string, content: string) => void;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (message.role === "user") {
    return (
      <div className="group flex flex-col items-end">
        <div className="message-user message-bubble max-w-[85%]">
          {message.content && (
            <div className="whitespace-pre-wrap text-[0.9375rem] leading-relaxed">{message.content}</div>
          )}
          {message.attachmentName && (
            <div
              className={`flex items-center gap-2 text-xs ${message.content ? "mt-2" : ""}`}
              style={{ color: "var(--fg-secondary)" }}
            >
              <FileText size={13} style={{ color: "var(--accent-from)" }} />
              <span>{message.attachmentName}</span>
            </div>
          )}
          {message.createdAt && <MessageTime createdAt={message.createdAt} align="end" />}
        </div>
        {message.searchUrl && (
          <p className="mt-2 max-w-[85%] text-xs" style={{ color: "var(--fg-muted)" }}>
            Searching from {message.searchUrl}
          </p>
        )}
        <MessageActions
          tokenCount={message.tokenCount}
          align="end"
          actions={
            <>
              <ActionButton onClick={copy} label={copied ? "Copied" : "Copy"} icon={<Copy size={13} />} />
              <ActionButton
                onClick={() => onEdit(message.id, message.content)}
                label="Edit"
                icon={<Pencil size={13} />}
              />
            </>
          }
        />
      </div>
    );
  }

  return (
    <div className="group">
      <div className="message-assistant message-bubble">
        {message.isStreaming && !message.content ? (
          <Loader2
            className="h-5 w-5 animate-spin"
            style={{ color: "var(--accent-from)" }}
          />
        ) : (
          <>
            <MarkdownContent content={message.content} />
            {message.createdAt && !message.isStreaming && (
              <MessageTime createdAt={message.createdAt} align="start" />
            )}
          </>
        )}
      </div>
      {message.content && (
        <MessageActions
          tokenCount={message.tokenCount}
          actions={
            <ActionButton onClick={copy} label={copied ? "Copied" : "Copy"} icon={<Copy size={13} />} />
          }
        />
      )}
    </div>
  );
}

function MessageTime({
  createdAt,
  align = "end",
}: {
  createdAt: string;
  align?: "start" | "end";
}) {
  return (
    <time
      dateTime={createdAt}
      className={`message-time ${align === "start" ? "message-time-left" : "message-time-right"}`}
      title={formatMessageTimeFull(createdAt)}
    >
      {formatMessageTime(createdAt)}
    </time>
  );
}

function MessageActions({
  actions,
  tokenCount,
  align = "start",
}: {
  actions: React.ReactNode;
  tokenCount?: number;
  align?: "start" | "end";
}) {
  return (
    <div
      className={`mt-2 flex items-center gap-2 ${align === "end" ? "justify-end" : "justify-start"}`}
    >
      <div className="flex items-center gap-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        {actions}
        {tokenCount != null && (
          <span className="text-xs tabular-nums" style={{ color: "var(--fg-muted)" }}>
            [{tokenCount} tokens]
          </span>
        )}
      </div>
    </div>
  );
}

function ActionButton({
  onClick,
  label,
  icon,
}: {
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="btn-ghost flex items-center gap-1.5 px-2.5 py-1.5 text-xs"
      style={{ color: "var(--fg-muted)" }}
    >
      {icon}
      {label}
    </button>
  );
}
