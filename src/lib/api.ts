export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface User {
  id: number;
  email: string;
  username: string;
  plan: "free" | "plus";
  tier: "basic" | "free" | "plus";
  token_limit: number;
  is_admin: boolean;
  email_verified: boolean;
}

export interface AdminStats {
  total_users: number;
  plus_users: number;
  free_users: number;
  total_chats: number;
  guest_chats: number;
  total_messages: number;
}

export interface AdminUser {
  id: number;
  email: string;
  username: string;
  plan: "free" | "plus";
  is_admin: boolean;
  chat_count: number;
  created_at: string;
}

export interface AdminChat {
  id: number;
  name: string;
  user_id: number | null;
  username: string | null;
  message_count: number;
  created_at: string;
  updated_at: string;
}

export interface Chat {
  id: number;
  name: string;
  folder_id?: number | null;
  token_used: number;
  token_limit: number;
  created_at: string;
  updated_at: string;
}

export interface ChatFolder {
  id: number;
  name: string;
  created_at: string;
}

export interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  token_count: number;
  created_at: string;
}

export interface ChatDetail extends Chat {
  messages: Message[];
}

export interface AppConfig {
  models: { id: string; name: string; available: boolean }[];
  basic_model: string;
  current_tier: string;
  allowed_models: string[];
  web_search_available: boolean;
  tiers: Record<string, { token_limit: number; web_search: boolean; models: number | string }>;
}

export type SendMode = "enter" | "shift-enter";

export interface ParsedPdf {
  filename: string;
  text: string;
  page_count: number;
  char_count: number;
  token_estimate: number;
}

export interface AttachedPdf {
  filename: string;
  text: string;
  pageCount: number;
  tokenEstimate: number;
}

export interface AdditionalDataItem {
  id: number;
  name: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface ParseFilesResult {
  text: string;
  filenames: string[];
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

function getGuestId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("guest_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("guest_id", id);
  }
  return id;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(parseErrorDetail(err));
  }
  return res.json();
}

function parseErrorDetail(err: { detail?: unknown }): string {
  const detail = err.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object" && "msg" in item) {
          return String((item as { msg: unknown }).msg);
        }
        return "Request failed";
      })
      .join(", ");
  }
  return "Request failed";
}

function guestQuery() {
  const token = getToken();
  if (token) return "";
  return `guest_id=${getGuestId()}`;
}

export const api = {
  getConfig: () => request<AppConfig>("/config"),
  register: (email: string, username: string, password: string) =>
    request<{ message: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, username, password }),
    }),
  login: (email: string, password: string) =>
    request<{ access_token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  me: () => request<User | null>("/auth/me"),
  verifyEmail: (token: string) =>
    request<{ message: string; access_token: string }>("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ token }),
    }),
  resendRegistration: (email: string) =>
    request<{ message: string }>("/auth/resend-registration", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  resendVerification: () =>
    request<{ message: string }>("/auth/resend-verification", { method: "POST" }),
  forgotPassword: (email: string) =>
    request<{ message: string }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  resetPassword: (token: string, newPassword: string) =>
    request<{ message: string }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, new_password: newPassword }),
    }),
  updateMe: (data: {
    username?: string;
    email?: string;
    current_password?: string;
    new_password?: string;
  }) =>
    request<User>("/users/me", { method: "PATCH", body: JSON.stringify(data) }),
  updatePlan: (plan: "free" | "plus") =>
    request<User>("/users/me/plan", { method: "POST", body: JSON.stringify({ plan }) }),
  listChats: () => {
    const q = guestQuery();
    return request<Chat[]>(`/chats${q ? `?${q}` : ""}`);
  },
  createChat: (name = "New Chat") => {
    const token = getToken();
    return request<Chat>("/chats", {
      method: "POST",
      body: JSON.stringify({ name, guest_id: token ? null : getGuestId() }),
    });
  },
  getChat: (id: number) => {
    const q = guestQuery();
    return request<ChatDetail>(`/chats/${id}${q ? `?${q}` : ""}`);
  },
  updateChat: (id: number, data: { name?: string; folder_id?: number | null }) => {
    const q = guestQuery();
    return request<Chat>(`/chats/${id}${q ? `?${q}` : ""}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },
  duplicateChat: (id: number) => {
    const q = guestQuery();
    return request<Chat>(`/chats/${id}/duplicate${q ? `?${q}` : ""}`, { method: "POST" });
  },
  deleteChat: (id: number) => {
    const q = guestQuery();
    return request<{ ok: boolean }>(`/chats/${id}${q ? `?${q}` : ""}`, { method: "DELETE" });
  },
  listChatFolders: () => request<ChatFolder[]>("/chat-folders"),
  createChatFolder: (name: string) =>
    request<ChatFolder>("/chat-folders", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),
  updateChatFolder: (id: number, name: string) =>
    request<ChatFolder>(`/chat-folders/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ name }),
    }),
  deleteChatFolder: (id: number) =>
    request<{ ok: boolean }>(`/chat-folders/${id}`, { method: "DELETE" }),
  parsePdf: async (file: File): Promise<ParsedPdf> => {
    const token = getToken();
    const form = new FormData();
    form.append("file", file);

    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${API_URL}/documents/parse-pdf`, {
      method: "POST",
      headers,
      body: form,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Failed to parse PDF" }));
      throw new Error(err.detail || "Failed to parse PDF");
    }

    return res.json();
  },
  listAdditionalData: () => {
    const q = guestQuery();
    return request<AdditionalDataItem[]>(`/additional-data${q ? `?${q}` : ""}`);
  },
  getAdditionalData: (id: number) => {
    const q = guestQuery();
    return request<AdditionalDataItem>(`/additional-data/${id}${q ? `?${q}` : ""}`);
  },
  createAdditionalData: (name: string, content: string) => {
    const token = getToken();
    return request<AdditionalDataItem>("/additional-data", {
      method: "POST",
      body: JSON.stringify({ name, content, guest_id: token ? null : getGuestId() }),
    });
  },
  appendAdditionalData: (id: number, content: string) => {
    const q = guestQuery();
    return request<AdditionalDataItem>(`/additional-data/${id}/append${q ? `?${q}` : ""}`, {
      method: "POST",
      body: JSON.stringify({ content }),
    });
  },
  updateAdditionalData: (id: number, content: string) => {
    const q = guestQuery();
    return request<AdditionalDataItem>(`/additional-data/${id}${q ? `?${q}` : ""}`, {
      method: "PATCH",
      body: JSON.stringify({ content }),
    });
  },
  renameAdditionalData: (id: number, name: string) => {
    const q = guestQuery();
    return request<AdditionalDataItem>(`/additional-data/${id}${q ? `?${q}` : ""}`, {
      method: "PATCH",
      body: JSON.stringify({ name }),
    });
  },
  duplicateAdditionalData: (id: number) => {
    const q = guestQuery();
    return request<AdditionalDataItem>(`/additional-data/${id}/duplicate${q ? `?${q}` : ""}`, {
      method: "POST",
    });
  },
  deleteAdditionalData: (id: number) => {
    const q = guestQuery();
    return request<{ ok: boolean }>(`/additional-data/${id}${q ? `?${q}` : ""}`, {
      method: "DELETE",
    });
  },
  parseFiles: async (files: File[]): Promise<ParseFilesResult> => {
    const token = getToken();
    const form = new FormData();
    files.forEach((file) => form.append("files", file));

    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${API_URL}/additional-data/parse-files`, {
      method: "POST",
      headers,
      body: form,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Failed to parse files" }));
      throw new Error(err.detail || "Failed to parse files");
    }

    return res.json();
  },
  sendMessage: async function* (
    chatId: number,
    content: string,
    model: string,
    webSearch: boolean,
    editMessageId?: number,
    document?: AttachedPdf,
    additionalDataIds: number[] = []
  ) {
    const token = getToken();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${API_URL}/chats/${chatId}/messages`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        content,
        model,
        web_search: webSearch,
        guest_id: token ? null : getGuestId(),
        edit_message_id: editMessageId ?? null,
        document_text: document?.text ?? null,
        document_filename: document?.filename ?? null,
        additional_data_ids: additionalDataIds,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Request failed" }));
      throw new Error(err.detail || "Request failed");
    }

    const reader = res.body?.getReader();
    if (!reader) return;

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() || "";

      for (const part of parts) {
        const lines = part.split("\n");
        let event = "message";
        let data = "";
        for (const line of lines) {
          if (line.startsWith("event: ")) event = line.slice(7);
          if (line.startsWith("data: ")) data = line.slice(6);
        }
        if (data) {
          yield { event, data: JSON.parse(data) };
        }
      }
    }
  },
  adminStats: () => request<AdminStats>("/admin/stats"),
  adminUsers: () => request<AdminUser[]>("/admin/users"),
  adminUpdateUser: (id: number, data: { plan?: "free" | "plus"; is_admin?: boolean }) =>
    request<AdminUser>(`/admin/users/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  adminDeleteUser: (id: number) =>
    request<{ ok: boolean }>(`/admin/users/${id}`, { method: "DELETE" }),
  adminChats: () => request<AdminChat[]>("/admin/chats"),
  adminDeleteChat: (id: number) =>
    request<{ ok: boolean }>(`/admin/chats/${id}`, { method: "DELETE" }),
};

export function saveToken(token: string) {
  localStorage.setItem("token", token);
}

export function clearToken() {
  localStorage.removeItem("token");
}

export function getSendMode(): SendMode {
  return (localStorage.getItem("send_mode") as SendMode) || "enter";
}

export function setSendMode(mode: SendMode) {
  localStorage.setItem("send_mode", mode);
}

export function getSidebarCollapsed(): boolean {
  return localStorage.getItem("sidebar_collapsed") === "true";
}

export function setSidebarCollapsed(collapsed: boolean) {
  localStorage.setItem("sidebar_collapsed", String(collapsed));
}

export function getVoiceReplyEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("voice_reply") === "true";
}

export function setVoiceReplyEnabled(enabled: boolean) {
  localStorage.setItem("voice_reply", String(enabled));
}
