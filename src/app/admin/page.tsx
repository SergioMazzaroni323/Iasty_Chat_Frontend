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
import { AdditionalDataItem, AdminChat, AdminStats, AdminUser, api } from "@/lib/api";
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
  const [chatsBusy, setChatsBusy] = useState(false);

  const [chatSearch, setChatSearch] = useState("");
  const [chatUserFilter, setChatUserFilter] = useState<number | "">("");
  const [chatIncludeGuests, setChatIncludeGuests] = useState(false);
  const [minTokens, setMinTokens] = useState("");
  const [maxTokens, setMaxTokens] = useState("");
  const [minMessages, setMinMessages] = useState("");
  const [maxMessages, setMaxMessages] = useState("");
  const [sortBy, setSortBy] = useState<"updated_at" | "created_at" | "message_count" | "token_used">("updated_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const [additionalDataUserId, setAdditionalDataUserId] = useState<number | null>(null);
  const [additionalDataBusy, setAdditionalDataBusy] = useState(false);
  const [additionalDataItems, setAdditionalDataItems] = useState<AdditionalDataItem[]>([]);
  const [additionalDataError, setAdditionalDataError] = useState("");

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

  const loadChatsWithFilters = useCallback(async () => {
    setChatsBusy(true);
    setError("");
    try {
      const toIntOrUndef = (v: string) => {
        if (!v.trim()) return undefined;
        const n = Number(v);
        if (Number.isNaN(n)) return undefined;
        return n;
      };

      const userId = chatUserFilter === "" ? undefined : chatUserFilter;
      const c = await api.adminChats({
        search: chatSearch.trim() || undefined,
        user_id: userId,
        include_guests: chatIncludeGuests,
        min_tokens: toIntOrUndef(minTokens),
        max_tokens: toIntOrUndef(maxTokens),
        min_messages: toIntOrUndef(minMessages),
        max_messages: toIntOrUndef(maxMessages),
        sort_by: sortBy,
        sort_dir: sortDir,
      });
      setChats(c);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load chats");
    } finally {
      setChatsBusy(false);
    }
  }, [chatIncludeGuests, chatSearch, chatUserFilter, maxMessages, maxTokens, minMessages, minTokens, sortBy, sortDir]);

  const openAdditionalDataForUser = useCallback(async (userId: number) => {
    setAdditionalDataUserId(userId);
    setAdditionalDataError("");
    setAdditionalDataItems([]);
    setAdditionalDataBusy(true);
    try {
      const items = await api.adminUserAdditionalData(userId);
      setAdditionalDataItems(items);
    } catch (err) {
      setAdditionalDataError(err instanceof Error ? err.message : "Failed to load additional data");
    } finally {
      setAdditionalDataBusy(false);
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
                    <th className="px-5 py-3.5 font-medium">Tokens</th>
                    <th className="px-5 py-3.5 font-medium">Additional data</th>
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
                      <td className="px-5 py-4 tabular-nums" style={{ color: "var(--fg-secondary)" }}>
                        {u.token_used}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="tabular-nums" style={{ color: "var(--fg-secondary)" }}>
                            {u.additional_data_count}
                          </span>
                          <button
                            disabled={additionalDataBusy || u.id === additionalDataUserId}
                            onClick={() => openAdditionalDataForUser(u.id)}
                            className="btn-ghost rounded-lg px-2 py-1 text-sm"
                          >
                            View
                          </button>
                        </div>
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
            <div className="mb-6 flex flex-wrap items-end gap-3">
              <div>
                <p className="mb-1 text-xs font-medium" style={{ color: "var(--fg-muted)" }}>
                  Search
                </p>
                <input
                  value={chatSearch}
                  onChange={(e) => setChatSearch(e.target.value)}
                  className="input-field h-9 w-56 px-3 text-sm"
                  placeholder="Chat name..."
                />
              </div>

              <div>
                <p className="mb-1 text-xs font-medium" style={{ color: "var(--fg-muted)" }}>
                  User
                </p>
                <select
                  value={chatUserFilter}
                  onChange={(e) => setChatUserFilter(e.target.value === "" ? "" : Number(e.target.value))}
                  className="input-field h-9 w-56 px-3 text-sm"
                >
                  <option value="">All registered users</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.username}
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-2 text-sm" style={{ color: "var(--fg-muted)" }}>
                <input
                  type="checkbox"
                  checked={chatIncludeGuests}
                  onChange={(e) => setChatIncludeGuests(e.target.checked)}
                />
                Include guest chats
              </label>

              <div className="flex items-end gap-3">
                <div>
                  <p className="mb-1 text-xs font-medium" style={{ color: "var(--fg-muted)" }}>
                    Tokens min/max
                  </p>
                  <div className="flex gap-2">
                    <input
                      value={minTokens}
                      onChange={(e) => setMinTokens(e.target.value)}
                      className="input-field h-9 w-28 px-3 text-sm"
                      placeholder="min"
                    />
                    <input
                      value={maxTokens}
                      onChange={(e) => setMaxTokens(e.target.value)}
                      className="input-field h-9 w-28 px-3 text-sm"
                      placeholder="max"
                    />
                  </div>
                </div>

                <div>
                  <p className="mb-1 text-xs font-medium" style={{ color: "var(--fg-muted)" }}>
                    Messages min/max
                  </p>
                  <div className="flex gap-2">
                    <input
                      value={minMessages}
                      onChange={(e) => setMinMessages(e.target.value)}
                      className="input-field h-9 w-28 px-3 text-sm"
                      placeholder="min"
                    />
                    <input
                      value={maxMessages}
                      onChange={(e) => setMaxMessages(e.target.value)}
                      className="input-field h-9 w-28 px-3 text-sm"
                      placeholder="max"
                    />
                  </div>
                </div>
              </div>

              <div>
                <p className="mb-1 text-xs font-medium" style={{ color: "var(--fg-muted)" }}>
                  Sort
                </p>
                <div className="flex gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    className="input-field h-9 w-36 px-3 text-sm"
                  >
                    <option value="updated_at">Updated</option>
                    <option value="created_at">Created</option>
                    <option value="message_count">Messages</option>
                    <option value="token_used">Tokens</option>
                  </select>
                  <select
                    value={sortDir}
                    onChange={(e) => setSortDir(e.target.value as typeof sortDir)}
                    className="input-field h-9 w-20 px-3 text-sm"
                  >
                    <option value="desc">Desc</option>
                    <option value="asc">Asc</option>
                  </select>
                </div>
              </div>

              <button
                disabled={chatsBusy || busy}
                onClick={loadChatsWithFilters}
                className="btn-primary h-9 px-4"
              >
                {chatsBusy ? "Loading..." : "Apply"}
              </button>
            </div>
            <div className="surface-3d overflow-hidden rounded-2xl">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead style={{ background: "var(--bg-sunken)", color: "var(--fg-muted)" }}>
                  <tr>
                    <th className="px-5 py-3.5 font-medium">Name</th>
                    <th className="px-5 py-3.5 font-medium">Owner</th>
                    <th className="px-5 py-3.5 font-medium">Messages</th>
                    <th className="px-5 py-3.5 font-medium">Tokens</th>
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
                      <td className="px-5 py-4 tabular-nums" style={{ color: "var(--fg-secondary)" }}>
                        {c.token_used}
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

      {additionalDataUserId !== null && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setAdditionalDataUserId(null);
          }}
        >
          <div className="glass-panel w-full max-w-3xl overflow-hidden rounded-2xl p-0">
            <div
              className="p-5"
              style={{ borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-sunken)" }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold">User additional data</h3>
                  <p className="mt-1 text-xs" style={{ color: "var(--fg-muted)" }}>
                    User: {additionalDataItems.length ? additionalDataItems[0].id : additionalDataUserId}
                  </p>
                </div>
                <button
                  onClick={() => setAdditionalDataUserId(null)}
                  className="btn-ghost rounded-lg px-3 py-2"
                  disabled={additionalDataBusy}
                >
                  Close
                </button>
              </div>
            </div>

            <div className="max-h-[70vh] overflow-y-auto p-5">
              {additionalDataBusy ? (
                <div style={{ color: "var(--fg-muted)" }}>Loading...</div>
              ) : additionalDataError ? (
                <div style={{ color: "#ef4444" }}>{additionalDataError}</div>
              ) : additionalDataItems.length === 0 ? (
                <div style={{ color: "var(--fg-muted)" }}>No additional data for this user.</div>
              ) : (
                <div className="space-y-4">
                  {additionalDataItems.map((item) => (
                    <div key={item.id} className="rounded-xl" style={{ border: "1px solid var(--border-subtle)" }}>
                      <div className="flex items-start justify-between gap-3 p-4">
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="mt-1 text-xs" style={{ color: "var(--fg-muted)" }}>
                            Updated: {new Date(item.updated_at).toLocaleString()}
                          </div>
                        </div>
                        <div className="text-xs tabular-nums" style={{ color: "var(--fg-muted)" }}>
                          #{item.id}
                        </div>
                      </div>
                      <div className="border-t border-[var(--border-subtle)] px-4 py-3">
                        <pre className="whitespace-pre-wrap text-sm" style={{ color: "var(--fg-primary)" }}>
                          {item.content}
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
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
