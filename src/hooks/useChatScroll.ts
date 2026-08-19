"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const BOTTOM_THRESHOLD_PX = 120;

function isNearBottom(element: HTMLDivElement) {
  return element.scrollHeight - element.scrollTop - element.clientHeight < BOTTOM_THRESHOLD_PX;
}

type ScrollMessage = {
  id: number | string;
  content: string;
};

export function useChatScroll(messages: ScrollMessage[], chatId: number | null) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);
  const [showJumpButton, setShowJumpButton] = useState(false);

  const scrollSignature = useMemo(() => {
    if (messages.length === 0) return "0";
    const last = messages[messages.length - 1];
    return `${messages.length}:${last.id}:${last.content.length}`;
  }, [messages]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const element = scrollRef.current;
    if (!element) return;
    element.scrollTo({ top: element.scrollHeight, behavior });
    stickToBottomRef.current = true;
    setShowJumpButton(false);
  }, []);

  const pinToBottom = useCallback(() => {
    stickToBottomRef.current = true;
    setShowJumpButton(false);
  }, []);

  const handleScroll = useCallback(() => {
    const element = scrollRef.current;
    if (!element) return;
    const nearBottom = isNearBottom(element);
    stickToBottomRef.current = nearBottom;
    setShowJumpButton(!nearBottom && messages.length > 0);
  }, [messages.length]);

  useEffect(() => {
    stickToBottomRef.current = true;
    setShowJumpButton(false);
    requestAnimationFrame(() => scrollToBottom("auto"));
  }, [chatId, scrollToBottom]);

  useEffect(() => {
    if (!stickToBottomRef.current) return;
    requestAnimationFrame(() => {
      const element = scrollRef.current;
      if (!element) return;
      element.scrollTop = element.scrollHeight;
      setShowJumpButton(false);
    });
  }, [scrollSignature]);

  return {
    scrollRef,
    showJumpButton,
    scrollToBottom,
    pinToBottom,
    handleScroll,
  };
}
