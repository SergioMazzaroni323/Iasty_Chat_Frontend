"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  LayoutDashboard,
  MessageSquare,
  Trash2,
  Users,
} from "lucide-react";
import { AdminChat, AdminStats, AdminUser, api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

type Tab = "dashboard" | "users" | "chats";

export default function AdminPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [chats, setChats] = useState<AdminChat[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      const [s, u, c] = await Promise.all([
        api.adminStats(),
        api.adminUsers(),
        api.adminChats(),
      ]);
      setStats(s);
      setUsers(u);
      setChats(c);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load admin data");
    }
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/");
      return;
    }
    if (!loading && user && !user.is_admin) {
      router.replace("/");
      return;
    }
    if (user?.is_admin) {
      load();
    }
  }, [user, loading, router, load]);

  const updateUser = async (id: number, data: { plan?: "free" | "plus"; is_admin?: boolean }) => {
    setBusy(true);
    try {
      const updated = await api.adminUpdateUser(id, data);
      setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(false);
    }
  };

  const deleteUser = async (id: number) => {
    if (!confirm("Delete this user and all their chats?")) return;
    setBusy(true);
    try {
      await api.adminDeleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  };

  const deleteChat = async (id: number) => {
    if (!confirm("Delete this chat?")) return;
    setBusy(true);
    try {
      await api.adminDeleteChat(id);
      setChats((prev) => prev.filter((c) => c.id !== id));
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  };

  if (loading || !user?.is_admin) {
    return (
      <div className="app-shell flex h-screen items-center justify-center">
        <p style={{ color: "var(--fg-muted)" }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className="app-shell flex min-h-screen">
      <aside
        className="glass-panel flex w-60 flex-col"
        style={{ borderTop: "none", borderBottom: "none", borderLeft: "none", borderRadius: 0 }}
      >
        <div className="p-5" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
          <h1 className="text-sm font-semibold tracking-tight">Admin</h1>
          <p className="mt-1 truncate text-xs" style={{ color: "var(--fg-muted)" }}>
            {user.email}
          </p>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          <NavItem
            active={tab === "dashboard"}
            onClick={() => setTab("dashboard")}
            icon={<LayoutDashboard size={16} />}
            label="Dashboard"
          />
          <NavItem
            active={tab === "users"}
            onClick={() => setTab("users")}
            icon={<Users size={16} />}
            label="Users"
          />
          <NavItem
            active={tab === "chats"}
            onClick={() => setTab("chats")}
            icon={<MessageSquare size={16} />}
            label="Chats"
          />
        </nav>
        <div className="p-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
          <Link
            href="/"
            className="dropdown-item rounded-xl"
            style={{ color: "var(--fg-secondary)" }}
          >
            <ArrowLeft size={16} />
            Back to chat
          </Link>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8">
        {error && (
          <div
            className="mb-6 rounded-xl px-4 py-3 text-sm"
            style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}
          >
            {error}
          </div>
        )}

        {tab === "dashboard" && stats && (
          <div>
            <h2 className="mb-8 text-2xl font-semibold tracking-tight">Dashboard</h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard label="Total users" value={stats.total_users} />
              <StatCard label="Plus users" value={stats.plus_users} />
              <StatCard label="Free users" value={stats.free_users} />
              <StatCard label="Total chats" value={stats.total_chats} />
              <StatCard label="Guest chats" value={stats.guest_chats} />
              <StatCard label="Total messages" value={stats.total_messages} />
            </div>
          </div>
        )}

        {tab === "users" && (
          <div>
            <h2 className="mb-8 text-2xl font-semibold tracking-tight">Users</h2>
            <div className="surface-3d overflow-hidden rounded-2xl">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead style={{ background: "var(--bg-sunken)", color: "var(--fg-muted)" }}>
                  <tr>
                    <th className="px-5 py-3.5 font-medium">User</th>
                    <th className="px-5 py-3.5 font-medium">Plan</th>
                    <th className="px-5 py-3.5 font-medium">Admin</th>
                    <th className="px-5 py-3.5 font-medium">Chats</th>
                    <th className="px-5 py-3.5 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} style={{ borderTop: "1px solid var(--border-subtle)" }}>
                      <td className="px-5 py-4">
                        <div className="font-medium">{u.username}</div>
                        <div className="text-xs" style={{ color: "var(--fg-muted)" }}>
                          {u.email}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <select
                          value={u.plan}
                          disabled={busy || u.id === user.id}
                          onChange={(e) =>
                            updateUser(u.id, { plan: e.target.value as "free" | "plus" })
                          }
                          className="input-field h-9 cursor-pointer px-3 text-sm"
                        >
                          <option value="free">Free</option>
                          <option value="plus">Plus</option>
                        </select>
                      </td>
                      <td className="px-5 py-4">
                        <input
                          type="checkbox"
                          checked={u.is_admin}
                          disabled={busy || u.id === user.id}
                          onChange={(e) => updateUser(u.id, { is_admin: e.target.checked })}
                          className="h-4 w-4 accent-indigo-500"
                        />
                      </td>
                      <td className="px-5 py-4 tabular-nums" style={{ color: "var(--fg-secondary)" }}>
                        {u.chat_count}
                      </td>
                      <td className="px-5 py-4">
                        <button
                          disabled={busy || u.id === user.id}
                          onClick={() => deleteUser(u.id)}
                          className="btn-ghost rounded-lg p-2"
                          style={{ color: "#ef4444" }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "chats" && (
          <div>
            <h2 className="mb-8 text-2xl font-semibold tracking-tight">Recent chats</h2>
            <div className="surface-3d overflow-hidden rounded-2xl">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead style={{ background: "var(--bg-sunken)", color: "var(--fg-muted)" }}>
                  <tr>
                    <th className="px-5 py-3.5 font-medium">Name</th>
                    <th className="px-5 py-3.5 font-medium">Owner</th>
                    <th className="px-5 py-3.5 font-medium">Messages</th>
                    <th className="px-5 py-3.5 font-medium">Updated</th>
                    <th className="px-5 py-3.5 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {chats.map((c) => (
                    <tr key={c.id} style={{ borderTop: "1px solid var(--border-subtle)" }}>
                      <td className="max-w-[200px] truncate px-5 py-4 font-medium">{c.name}</td>
                      <td className="px-5 py-4" style={{ color: "var(--fg-secondary)" }}>
                        {c.username || "Guest"}
                      </td>
                      <td className="px-5 py-4 tabular-nums" style={{ color: "var(--fg-secondary)" }}>
                        {c.message_count}
                      </td>
                      <td className="px-5 py-4 text-xs" style={{ color: "var(--fg-muted)" }}>
                        {new Date(c.updated_at).toLocaleString()}
                      </td>
                      <td className="px-5 py-4">
                        <button
                          disabled={busy}
                          onClick={() => deleteChat(c.id)}
                          className="btn-ghost rounded-lg p-2"
                          style={{ color: "#ef4444" }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function NavItem({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
        active ? "" : "hover:opacity-80"
      }`}
      style={
        active
          ? {
              background: "color-mix(in srgb, var(--accent-from) 12%, transparent)",
              color: "var(--accent-from)",
              boxShadow: "var(--shadow-sm)",
            }
          : { color: "var(--fg-secondary)" }
      }
    >
      {icon}
      {label}
    </button>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="stat-card">
      <p className="text-sm font-medium" style={{ color: "var(--fg-muted)" }}>
        {label}
      </p>
      <p className="mt-3 text-4xl font-bold tracking-tight tabular-nums">{value.toLocaleString()}</p>
    </div>
  );
}
