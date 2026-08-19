"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { User, api } from "@/lib/api";
import { PasswordField } from "./PasswordField";

interface SettingsDialogProps {
  open: boolean;
  user: User;
  onClose: () => void;
  onUpdated: (user: User) => void;
}

export function SettingsDialog({ open, user, onClose, onUpdated }: SettingsDialogProps) {
  const [tab, setTab] = useState<"user" | "premium">("user");
  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const saveUser = async () => {
    setLoading(true);
    setMessage("");
    try {
      const updated = await api.updateMe({
        username,
        email,
        current_password: newPassword ? currentPassword : undefined,
        new_password: newPassword || undefined,
      });
      onUpdated(updated);
      setMessage("Settings saved.");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  const changePlan = async (plan: "free" | "plus") => {
    setLoading(true);
    setMessage("");
    try {
      const updated = await api.updatePlan(plan);
      onUpdated(updated);
      setMessage(
        plan === "plus"
          ? "Upgraded to Plus. Stripe billing will be added later."
          : "Downgraded to Free."
      );
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to update plan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="surface-3d flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl">
        <div
          className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          <h2 className="text-lg font-semibold tracking-tight">Settings</h2>
          <button onClick={onClose} className="btn-icon h-9 w-9">
            <X size={18} />
          </button>
        </div>

        <div className="flex px-2" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
          <TabButton active={tab === "user"} onClick={() => setTab("user")} label="Account" />
          <TabButton active={tab === "premium"} onClick={() => setTab("premium")} label="Subscription" />
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {tab === "user" && (
            <div className="space-y-5">
              <Field label="Username">
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input-field px-4 py-2.5 text-sm"
                />
              </Field>
              <Field label="Email">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field px-4 py-2.5 text-sm"
                />
                {!user.email_verified && (
                  <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
                    Your email is not verified yet. Save a new email to receive a fresh verification link.
                  </p>
                )}
              </Field>
              <Field label="Current password">
                <PasswordField
                  value={currentPassword}
                  onChange={setCurrentPassword}
                  placeholder="Required to change password"
                />
              </Field>
              <Field label="New password">
                <PasswordField value={newPassword} onChange={setNewPassword} placeholder="Leave blank to keep" />
              </Field>
              <button
                onClick={saveUser}
                disabled={loading}
                className="btn-primary rounded-xl px-5 py-2.5 text-sm"
              >
                Save changes
              </button>
            </div>
          )}

          {tab === "premium" && (
            <div className="space-y-6">
              <p className="text-sm" style={{ color: "var(--fg-muted)" }}>
                Current plan:{" "}
                <span className="badge">{user.plan}</span>
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <PlanCard
                  name="Free"
                  price="$0"
                  features={["All models", "60,000 token threads", "No web search"]}
                  active={user.plan === "free"}
                  actionLabel="Downgrade to Free"
                  onAction={() => changePlan("free")}
                  disabled={user.plan === "free" || loading}
                />
                <PlanCard
                  name="Plus"
                  price="Soon"
                  features={["All models", "300,000 token threads", "Web search"]}
                  active={user.plan === "plus"}
                  actionLabel="Upgrade to Plus"
                  onAction={() => changePlan("plus")}
                  disabled={user.plan === "plus" || loading}
                  highlight
                />
              </div>
              <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
                Stripe billing will be added in a future release.
              </p>
            </div>
          )}

          {message && (
            <p className="mt-4 text-sm font-medium" style={{ color: "var(--accent-from)" }}>
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className="relative px-5 py-3.5 text-sm font-medium transition-colors"
      style={{ color: active ? "var(--accent-from)" : "var(--fg-muted)" }}
    >
      {label}
      {active && (
        <span
          className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full"
          style={{ background: "linear-gradient(90deg, var(--accent-from), var(--accent-to))" }}
        />
      )}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium" style={{ color: "var(--fg-secondary)" }}>
        {label}
      </span>
      {children}
    </label>
  );
}

function PlanCard({
  name,
  price,
  features,
  active,
  actionLabel,
  onAction,
  disabled,
  highlight,
}: {
  name: string;
  price: string;
  features: string[];
  active: boolean;
  actionLabel: string;
  onAction: () => void;
  disabled: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={`surface-3d rounded-2xl p-5 ${active || highlight ? "ring-2 ring-indigo-500/40" : ""}`}
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{name}</h3>
        {active && <Check size={16} style={{ color: "var(--accent-from)" }} />}
      </div>
      <p className="mt-2 text-3xl font-bold tracking-tight">{price}</p>
      <ul className="mt-5 space-y-2.5 text-sm" style={{ color: "var(--fg-secondary)" }}>
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2">
            <span className="h-1 w-1 rounded-full" style={{ background: "var(--accent-from)" }} />
            {f}
          </li>
        ))}
      </ul>
      <button
        onClick={onAction}
        disabled={disabled}
        className={`mt-5 w-full rounded-xl py-2.5 text-sm font-medium ${active ? "surface-inset cursor-default" : "btn-primary"}`}
        style={active ? { color: "var(--fg-muted)" } : undefined}
      >
        {active ? "Current plan" : actionLabel}
      </button>
    </div>
  );
}
