"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PasswordField } from "@/components/PasswordField";
import { api } from "@/lib/api";

export default function ResetPasswordClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (!token) {
      setMessage("Missing reset token.");
      return;
    }
    if (password !== confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await api.resetPassword(token, password);
      setSuccess(true);
      setMessage(res.message);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell flex min-h-screen items-center justify-center p-4">
      <div className="surface-3d w-full max-w-md rounded-2xl p-8">
        <h1 className="text-xl font-semibold tracking-tight">Reset password</h1>
        <p className="mt-2 text-sm" style={{ color: "var(--fg-muted)" }}>
          Choose a new password for your account.
        </p>

        {success ? (
          <div className="mt-6 space-y-4 text-center">
            <p className="text-sm" style={{ color: "var(--accent-from)" }}>
              {message}
            </p>
            <Link href="/" className="btn-primary inline-flex rounded-xl px-5 py-2.5 text-sm">
              Back to Iasty
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <PasswordField
              value={password}
              onChange={setPassword}
              placeholder="New password"
              required
              minLength={6}
            />
            <PasswordField
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="Confirm new password"
              required
              minLength={6}
            />
            {message && (
              <p
                className="rounded-lg px-3 py-2 text-sm"
                style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}
              >
                {message}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full rounded-xl py-2.5 text-sm"
            >
              {loading ? "Saving..." : "Update password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
