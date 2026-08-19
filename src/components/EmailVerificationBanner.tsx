"use client";

import { MailWarning } from "lucide-react";
import { useState } from "react";
import { api } from "@/lib/api";

interface EmailVerificationBannerProps {
  email: string;
}

export function EmailVerificationBanner({ email }: EmailVerificationBannerProps) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const resend = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await api.resendVerification();
      setMessage(res.message);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to resend verification email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
      style={{
        background: "rgba(99, 102, 241, 0.12)",
        borderBottom: "1px solid var(--border-subtle)",
        color: "var(--fg-primary)",
      }}
    >
      <div className="flex items-start gap-2">
        <MailWarning size={18} className="mt-0.5 shrink-0" style={{ color: "var(--accent-from)" }} />
        <div>
          <p className="font-medium">Verify your email to secure your account</p>
          <p style={{ color: "var(--fg-muted)" }}>
            We sent a verification link to <span className="font-medium">{email}</span>.
          </p>
          {message && (
            <p className="mt-1" style={{ color: "var(--accent-from)" }}>
              {message}
            </p>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={resend}
        disabled={loading}
        className="btn-primary shrink-0 rounded-lg px-3 py-1.5 text-sm"
      >
        {loading ? "Sending..." : "Resend email"}
      </button>
    </div>
  );
}
