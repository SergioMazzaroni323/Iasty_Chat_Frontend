"use client";

import dynamic from "next/dynamic";

export const ClientChatApp = dynamic(
  () => import("@/components/ChatApp").then((mod) => mod.ChatApp),
  {
    ssr: false,
    loading: () => (
      <div className="app-shell flex h-screen items-center justify-center">
        <p className="text-sm" style={{ color: "var(--fg-muted)" }}>
          Loading...
        </p>
      </div>
    ),
  }
);
