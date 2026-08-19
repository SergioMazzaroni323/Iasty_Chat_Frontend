"use client";

import { useEffect, useRef, useState } from "react";

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  delay?: number;
  placement?: "top" | "bottom";
  className?: string;
  variant?: "chip" | "default";
}

export function Tooltip({
  content,
  children,
  delay = 300,
  placement = "top",
  className = "",
  variant = "chip",
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => {
    timeoutRef.current = setTimeout(() => setVisible(true), delay);
  };

  const hide = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const tooltipPosition =
    placement === "bottom"
      ? "top-full left-1/2 mt-2 -translate-x-1/2"
      : "bottom-full left-1/2 mb-2 -translate-x-1/2";

  const tooltipClass = variant === "chip" ? "tooltip-chip" : "tooltip-3d";

  return (
    <div
      className={`relative flex ${className}`}
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      {children}
      {visible && (
        <div
          className={`${tooltipClass} pointer-events-none absolute z-[100] whitespace-nowrap ${tooltipPosition}`}
        >
          {content}
        </div>
      )}
    </div>
  );
}
