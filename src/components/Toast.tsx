"use client";

import { useCallback, useEffect, useState } from "react";

export type ToastVariant = "success" | "error";

export interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

let pushToast: ((message: string, variant?: ToastVariant) => void) | null = null;

export function toast(message: string, variant: ToastVariant = "success") {
  pushToast?.(message, variant);
}

export function ToastHost() {
  const [items, setItems] = useState<ToastItem[]>([]);

  const addToast = useCallback((message: string, variant: ToastVariant = "success") => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev, { id, message, variant }]);
  }, []);

  useEffect(() => {
    pushToast = addToast;
    return () => {
      pushToast = null;
    };
  }, [addToast]);

  useEffect(() => {
    if (items.length === 0) return;
    const timer = window.setTimeout(() => {
      setItems((prev) => prev.slice(1));
    }, 4000);
    return () => window.clearTimeout(timer);
  }, [items]);

  if (items.length === 0) return null;

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[300] flex w-full max-w-sm flex-col gap-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="pointer-events-auto rounded-xl px-4 py-3 text-sm shadow-lg"
          style={{
            background: item.variant === "success" ? "rgba(34,197,94,0.95)" : "rgba(239,68,68,0.95)",
            color: "#fff",
            border: `1px solid ${item.variant === "success" ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.2)"}`,
          }}
        >
          {item.message}
        </div>
      ))}
    </div>
  );
}
