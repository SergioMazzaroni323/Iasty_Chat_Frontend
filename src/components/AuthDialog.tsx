"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { PasswordField } from "./PasswordField";
import { api } from "@/lib/api";

interface AuthDialogProps {
  open: boolean;
  onClose: () => void;
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (email: string, username: string, password: string) => Promise<string>;
}

type AuthMode = "login" | "register" | "forgot";

export function AuthDialog({ open, onClose, onLogin, onRegister }: AuthDialogProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const resetForm = () => {
    setEmail("");
    setUsername("");
    setPassword("");
    setConfirmPassword("");
    setError("");
    setInfo("");
  };

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setError("");
    setInfo("");
    setConfirmPassword("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");

    if (mode === "register" && password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      if (mode === "login") {
        await onLogin(email, password);
        onClose();
        resetForm();
      } else if (mode === "register") {
        const message = await onRegister(email, username, password);
        setInfo(message);
        switchMode("login");
      } else {
        const res = await api.forgotPassword(email);
        setInfo(res.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const title =
    mode === "login" ? "Welcome back" : mode === "register" ? "Create account" : "Reset password";
  const subtitle =
    mode === "login"
      ? "Sign in to continue"
      : mode === "register"
        ? "Get started for free"
        : "Enter your email and we will send a reset link";

  return (
    <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="surface-3d w-full max-w-md rounded-2xl p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
            <p className="mt-1 text-sm" style={{ color: "var(--fg-muted)" }}>
              {subtitle}
            </p>
          </div>
          <button onClick={onClose} className="btn-icon h-9 w-9">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === "register" && (
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="input-field px-4 py-2.5 text-sm"
            />
          )}
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="input-field px-4 py-2.5 text-sm"
          />
          {mode !== "forgot" && (
            <PasswordField
              value={password}
              onChange={setPassword}
              placeholder="Password"
              required
              minLength={6}
            />
          )}
          {mode === "register" && (
            <PasswordField
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="Confirm password"
              required
              minLength={6}
            />
          )}
          {error && (
            <p className="rounded-lg px-3 py-2 text-sm" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
              {error}
            </p>
          )}
          {info && (
            <p className="rounded-lg px-3 py-2 text-sm" style={{ background: "rgba(99,102,241,0.1)", color: "var(--accent-from)" }}>
              {info}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full rounded-xl py-2.5 text-sm"
          >
            {loading
              ? "Please wait..."
              : mode === "login"
                ? "Sign in"
                : mode === "register"
                  ? "Create account"
                  : "Send reset link"}
          </button>
        </form>

        <div className="mt-6 space-y-3 text-center text-sm" style={{ color: "var(--fg-muted)" }}>
          {mode === "login" && (
            <button
              type="button"
              onClick={() => switchMode("forgot")}
              className="font-medium hover:underline"
              style={{ color: "var(--accent-from)" }}
            >
              Forgot password?
            </button>
          )}
          <p>
            {mode === "login" && (
              <>
                Don&apos;t have an account?{" "}
                <button
                  onClick={() => switchMode("register")}
                  className="font-medium hover:underline"
                  style={{ color: "var(--accent-from)" }}
                >
                  Register
                </button>
              </>
            )}
            {mode === "register" && (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => switchMode("login")}
                  className="font-medium hover:underline"
                  style={{ color: "var(--accent-from)" }}
                >
                  Sign in
                </button>
              </>
            )}
            {mode === "forgot" && (
              <>
                Remember your password?{" "}
                <button
                  onClick={() => switchMode("login")}
                  className="font-medium hover:underline"
                  style={{ color: "var(--accent-from)" }}
                >
                  Back to sign in
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
