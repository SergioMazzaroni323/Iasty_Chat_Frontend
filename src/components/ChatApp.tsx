"use client";

import { ChevronDown, Menu } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { AuthDialog } from "@/components/AuthDialog";
import { EmailVerificationBanner } from "@/components/EmailVerificationBanner";
import { AdditionalDataDialog } from "@/components/AdditionalDataDialog";
import { AdditionalDataPanel } from "@/components/AdditionalDataPanel";
import { InputBar, VoiceControls } from "@/components/InputBar";
import { DisplayMessage, MessageList } from "@/components/MessageList";
import { SettingsDialog } from "@/components/SettingsDialog";
import { Sidebar, SidebarTab } from "@/components/Sidebar";
import { ThreadHeader } from "@/components/ThreadHeader";
import { useAuth } from "@/hooks/useAuth";
import { useChatScroll } from "@/hooks/useChatScroll";
import { useSidebarState } from "@/hooks/useSidebarState";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import {
  api,
  AdditionalDataItem,
  AppConfig,
  AttachedPdf,
  Chat,
  ChatFolder,
  getVoiceReplyEnabled,
  setVoiceReplyEnabled,
} from "@/lib/api";
import { formatApiError } from "@/lib/formatError";
import { splitUserMessageContent } from "@/lib/formatMessage";
import { HoverChip } from "@/components/HoverChip";

export function ChatApp() {
  const { user, loading: authLoading, login, register, logout, refresh } = useAuth();
  const { collapsed, toggleCollapsed, mobileOpen, setMobileOpen } = useSidebarState();

  const [config, setConfig] = useState<AppConfig | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [folders, setFolders] = useState<ChatFolder[]>([]);
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [tokenUsed, setTokenUsed] = useState(0);
  const [tokenLimit, setTokenLimit] = useState(20000);
  const [chatName, setChatName] = useState("New Chat");
  const [selectedModel, setSelectedModel] = useState("gpt-4o-mini");
  const [webSearch, setWebSearch] = useState(false);
  const [sending, setSending] = useState(false);
  const [editMessageId, setEditMessageId] = useState<number | null>(null);
  const [editInitialValue, setEditInitialValue] = useState("");
  const [authOpen, setAuthOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sendError, setSendError] = useState("");
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("chats");
  const [additionalData, setAdditionalData] = useState<AdditionalDataItem[]>([]);
  const [activeAdditionalDataId, setActiveAdditionalDataId] = useState<number | null>(null);
  const [dataDialogOpen, setDataDialogOpen] = useState(false);
  const [dataDialogMode, setDataDialogMode] = useState<"create" | "append">("create");
  const [additionalDataEditing, setAdditionalDataEditing] = useState(false);
  const [selectedRagDataIds, setSelectedRagDataIds] = useState<number[]>([]);
  const [voiceReplyEnabled, setVoiceReplyEnabledState] = useState(false);
  const { supported: voiceReplySupported, speak, stop: stopSpeech } = useSpeechSynthesis();
  const voiceControlsRef = useRef<VoiceControls | null>(null);
  const voiceReplyEnabledRef = useRef(voiceReplyEnabled);
  voiceReplyEnabledRef.current = voiceReplyEnabled;

  const resumeVoiceInput = useCallback(() => {
    if (voiceReplyEnabledRef.current) {
      voiceControlsRef.current?.startListening();
    }
  }, []);

  const { scrollRef, showJumpButton, scrollToBottom, pinToBottom, handleScroll } = useChatScroll(
    messages,
    activeChatId
  );

  const ragDataStorageKey = (chatId: number) => `rag_data_ids_${chatId}`;
  const accountKey = user?.id ?? "guest";

  const resetChatSession = useCallback(() => {
    setChats([]);
    setAdditionalData([]);
    setActiveChatId(null);
    setMessages([]);
    setChatName("New Chat");
    setTokenUsed(0);
    setTokenLimit(20000);
    setEditMessageId(null);
    setEditInitialValue("");
    setSendError("");
    setSelectedRagDataIds([]);
    setWebSearch(false);
    setActiveAdditionalDataId(null);
  }, []);

  const loadConfig = useCallback(async () => {
    const cfg = await api.getConfig();
    setConfig(cfg);
    const pickable = cfg.models.filter(
      (model) => cfg.allowed_models.includes(model.id) && model.available
    );
    if (pickable.length > 0 && !pickable.some((model) => model.id === selectedModel)) {
      setSelectedModel(pickable[0].id);
    }
  }, [selectedModel]);

  const loadChats = useCallback(async () => {
    const list = await api.listChats();
    setChats(list);
    return list;
  }, []);

  const loadFolders = useCallback(async () => {
    if (!user) {
      setFolders([]);
      return [];
    }
    const list = await api.listChatFolders();
    setFolders(list);
    return list;
  }, [user]);

  const loadAdditionalData = useCallback(async () => {
    const list = await api.listAdditionalData();
    setAdditionalData(list);
    return list;
  }, []);

  const loadChat = useCallback(async (id: number) => {
    const chat = await api.getChat(id);
    setActiveChatId(chat.id);
    setChatName(chat.name);
    setTokenUsed(chat.token_used);
    setTokenLimit(chat.token_limit);
    setMessages(
      chat.messages.map((m) => {
        if (m.role !== "user") {
          return {
            id: m.id,
            role: m.role,
            content: m.content,
            tokenCount: m.token_count,
            createdAt: m.created_at,
          };
        }
        const parsed = splitUserMessageContent(m.content);
        return {
          id: m.id,
          role: m.role,
          content: parsed.text,
          attachmentName: parsed.attachmentName,
          tokenCount: m.token_count,
          createdAt: m.created_at,
        };
      })
    );
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig, user]);

  useEffect(() => {
    setVoiceReplyEnabledState(getVoiceReplyEnabled());
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("verified") !== "1") return;
    refresh();
    window.history.replaceState({}, "", "/");
  }, [refresh]);

  useEffect(() => {
    stopSpeech();
    voiceControlsRef.current?.stopListening();
  }, [activeChatId, stopSpeech]);

  useEffect(() => {
    loadFolders();
  }, [loadFolders]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      resetChatSession();
      const list = await loadChats();
      if (cancelled) return;
      if (list.length > 0) {
        await loadChat(list[0].id);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [accountKey, loadChats, loadChat, resetChatSession]);

  useEffect(() => {
    loadAdditionalData();
  }, [loadAdditionalData, user]);

  useEffect(() => {
    if (!activeChatId) {
      setSelectedRagDataIds([]);
      return;
    }
    try {
      const raw = localStorage.getItem(ragDataStorageKey(activeChatId));
      setSelectedRagDataIds(raw ? JSON.parse(raw) : []);
    } catch {
      setSelectedRagDataIds([]);
    }
  }, [activeChatId]);

  useEffect(() => {
    const validIds = new Set(additionalData.map((item) => item.id));
    setSelectedRagDataIds((prev) => {
      const next = prev.filter((id) => validIds.has(id));
      if (next.length !== prev.length && activeChatId) {
        localStorage.setItem(ragDataStorageKey(activeChatId), JSON.stringify(next));
      }
      return next.length === prev.length ? prev : next;
    });
  }, [additionalData, activeChatId]);

  const handleRagDataChange = (ids: number[]) => {
    setSelectedRagDataIds(ids);
    if (activeChatId) {
      localStorage.setItem(ragDataStorageKey(activeChatId), JSON.stringify(ids));
    }
  };

  const toggleVoiceReply = () => {
    setVoiceReplyEnabledState((prev) => {
      const next = !prev;
      setVoiceReplyEnabled(next);
      if (!next) {
        stopSpeech();
        voiceControlsRef.current?.stopListening();
      } else {
        queueMicrotask(() => voiceControlsRef.current?.startListening());
      }
      return next;
    });
  };

  const activeAdditionalData =
    additionalData.find((item) => item.id === activeAdditionalDataId) ?? null;

  const openCreateDataDialog = () => {
    if (additionalDataEditing) return;
    setDataDialogMode("create");
    setDataDialogOpen(true);
  };

  const openAppendDataDialog = () => {
    if (additionalDataEditing) return;
    setDataDialogMode("append");
    setDataDialogOpen(true);
  };

  const handleSaveAdditionalData = async (payload: { name?: string; content: string }) => {
    if (dataDialogMode === "create") {
      const created = await api.createAdditionalData(payload.name || "Untitled", payload.content);
      await loadAdditionalData();
      setActiveAdditionalDataId(created.id);
      setSidebarTab("additional-data");
      return;
    }

    if (!activeAdditionalDataId) return;
    const updated = await api.appendAdditionalData(activeAdditionalDataId, payload.content);
    await loadAdditionalData();
    setActiveAdditionalDataId(updated.id);
  };

  const handleSelectAdditionalData = async (id: number) => {
    if (additionalDataEditing) return;
    setSidebarTab("additional-data");
    setActiveAdditionalDataId(id);
    const item = await api.getAdditionalData(id);
    setAdditionalData((prev) => {
      const exists = prev.some((entry) => entry.id === item.id);
      return exists ? prev.map((entry) => (entry.id === item.id ? item : entry)) : [item, ...prev];
    });
  };

  const handleDeleteAdditionalData = async (id: number) => {
    await api.deleteAdditionalData(id);
    const list = await loadAdditionalData();
    if (activeAdditionalDataId === id) {
      setActiveAdditionalDataId(list[0]?.id ?? null);
    }
  };

  const handleUpdateAdditionalData = async (id: number, content: string) => {
    const updated = await api.updateAdditionalData(id, content);
    await loadAdditionalData();
    setActiveAdditionalDataId(updated.id);
  };

  const handleSelectChat = async (id: number) => {
    setSidebarTab("chats");
    await loadChat(id);
  };

  const handleNewChat = async () => {
    const chat = await api.createChat();
    setChats((prev) => [chat, ...prev]);
    setActiveChatId(chat.id);
    setChatName(chat.name);
    setTokenUsed(0);
    setTokenLimit(chat.token_limit);
    setMessages([]);
    setEditMessageId(null);
    setEditInitialValue("");
  };

  const deriveChatName = (content: string) =>
    content.slice(0, 80) + (content.length > 80 ? "..." : "");

  const updateChatInList = (chatId: number, name: string, tokenUsed?: number) => {
    setChats((prev) =>
      prev.map((c) =>
        c.id === chatId
          ? { ...c, name, ...(tokenUsed !== undefined ? { token_used: tokenUsed } : {}) }
          : c
      )
    );
  };

  const handleSend = async (content: string, document?: AttachedPdf) => {
    if (sending) return;

    const useWebSearch = webSearch;
    setWebSearch(false);

    let chatId = activeChatId;
    if (!chatId) {
      const chat = await api.createChat();
      chatId = chat.id;
      setActiveChatId(chatId);
      setChats((prev) => [chat, ...prev]);
      setChatName(chat.name);
      setTokenLimit(chat.token_limit);
    }

    setSending(true);
    setSendError("");
    stopSpeech();
    voiceControlsRef.current?.stopListening();

    if (chatName === "New Chat") {
      const newName = deriveChatName(content || document?.filename || "PDF Chat");
      setChatName(newName);
      updateChatInList(chatId, newName);
    }

    const userMsgId = `temp-${Date.now()}`;
    const userCreatedAt = new Date().toISOString();
    pinToBottom();
    setMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        role: "user",
        content,
        attachmentName: document?.filename,
        searchUrl: undefined,
        createdAt: userCreatedAt,
      },
      { id: "streaming", role: "assistant", content: "", isStreaming: true },
    ]);
    requestAnimationFrame(() => scrollToBottom("smooth"));

    let searchUrls: string[] = [];
    let searchIndex = 0;
    let searchInterval: ReturnType<typeof setInterval> | null = null;

    const updateSearchUrl = (url: string) => {
      searchUrls.push(url);
      if (!searchInterval && searchUrls.length > 0) {
        searchInterval = setInterval(() => {
          searchIndex = (searchIndex + 1) % searchUrls.length;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === userMsgId ? { ...m, searchUrl: searchUrls[searchIndex] } : m
            )
          );
        }, 1200);
      }
      setMessages((prev) =>
        prev.map((m) => (m.id === userMsgId ? { ...m, searchUrl: url } : m))
      );
    };

    try {
      const stream = api.sendMessage(
        chatId,
        content,
        selectedModel,
        useWebSearch,
        editMessageId ?? undefined,
        document,
        selectedRagDataIds
      );

      let assistantContent = "";
      let gotFirstToken = false;

      for await (const event of stream) {
        if (event.event === "chat_updated") {
          setChatName(event.data.name);
          setTokenUsed(event.data.token_used);
          updateChatInList(chatId, event.data.name, event.data.token_used);
          if (event.data.user_message_id) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === userMsgId
                  ? {
                      ...m,
                      id: event.data.user_message_id,
                      tokenCount: event.data.user_message_tokens ?? m.tokenCount,
                      createdAt: event.data.user_message_created_at ?? m.createdAt,
                    }
                  : m
              )
            );
          }
        }

        if (event.event === "search_source" && event.data.url) {
          updateSearchUrl(event.data.url);
        }

        if (event.event === "token" && event.data.content) {
          if (searchInterval) {
            clearInterval(searchInterval);
            searchInterval = null;
          }
          gotFirstToken = true;
          assistantContent += event.data.content;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === "streaming"
                ? { ...m, content: assistantContent, isStreaming: false }
                : m
            )
          );
        }

        if (event.event === "usage") {
          setTokenUsed(event.data.token_used);
          setMessages((prev) =>
            prev.map((m) => {
              if (
                (m.id === userMsgId || m.id === event.data.user_message_id) &&
                event.data.user_message_id
              ) {
                return {
                  ...m,
                  id: event.data.user_message_id,
                  tokenCount: event.data.user_message_tokens ?? m.tokenCount,
                  createdAt: event.data.user_message_created_at ?? m.createdAt,
                };
              }
              if (m.id === "streaming" && event.data.assistant_message_id) {
                return {
                  ...m,
                  id: event.data.assistant_message_id,
                  isStreaming: false,
                  tokenCount: event.data.assistant_message_tokens,
                  createdAt: event.data.assistant_message_created_at,
                };
              }
              return m;
            })
          );
        }

        if (event.event === "error") {
          throw new Error(event.data.message || "Stream error");
        }
      }

      if (!gotFirstToken) {
        setMessages((prev) => prev.filter((m) => m.id !== "streaming"));
        if (voiceReplyEnabledRef.current) {
          resumeVoiceInput();
        }
      } else if (voiceReplyEnabled && assistantContent.trim()) {
        speak(assistantContent, resumeVoiceInput);
      } else if (voiceReplyEnabled) {
        resumeVoiceInput();
      }

      const updatedChats = await loadChats();
      const current = updatedChats.find((c) => c.id === chatId);
      if (current) {
        setChatName(current.name);
        setTokenUsed(current.token_used);
      }
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== "streaming" && m.id !== userMsgId));
      const msg = err instanceof Error ? formatApiError(err.message) : "Failed to send message";
      setSendError(msg);
    } finally {
      if (searchInterval) clearInterval(searchInterval);
      setSending(false);
      setEditMessageId(null);
      setEditInitialValue("");
    }
  };

  const handleEdit = (id: number | string, content: string) => {
    if (typeof id !== "number") return;
    const idx = messages.findIndex((m) => m.id === id);
    if (idx === -1) return;
    setMessages(messages.slice(0, idx));
    setEditMessageId(id);
    setEditInitialValue(content);
  };

  const canUseWebSearchTier = user?.tier === "plus" || user?.plan === "plus";
  const allowedModels = config?.allowed_models || ["gpt-4o-mini"];
  const models = config?.models || [];

  return (
    <div className="app-shell flex h-screen overflow-hidden">
      <Sidebar
        tab={sidebarTab}
        onTabChange={(tab) => {
          if (additionalDataEditing) return;
          setSidebarTab(tab);
        }}
        chats={chats}
        folders={folders}
        activeChatId={activeChatId}
        additionalData={additionalData}
        activeAdditionalDataId={activeAdditionalDataId}
        actionsDisabled={additionalDataEditing}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        user={user}
        onToggleCollapsed={toggleCollapsed}
        onCloseMobile={() => setMobileOpen(false)}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onSelectAdditionalData={handleSelectAdditionalData}
        onAddAdditionalData={openCreateDataDialog}
        onRenameAdditionalData={async (id, name) => {
          await api.renameAdditionalData(id, name);
          await loadAdditionalData();
        }}
        onDuplicateAdditionalData={async (id) => {
          const copy = await api.duplicateAdditionalData(id);
          await loadAdditionalData();
          await handleSelectAdditionalData(copy.id);
        }}
        onDeleteAdditionalData={handleDeleteAdditionalData}
        onLogin={() => setAuthOpen(true)}
        onSettings={() => setSettingsOpen(true)}
        onLogout={() => {
          resetChatSession();
          logout();
        }}
        onRename={async (id, name) => {
          await api.updateChat(id, { name });
          if (id === activeChatId) setChatName(name);
          await loadChats();
        }}
        onDuplicate={async (id) => {
          const copy = await api.duplicateChat(id);
          await loadChats();
          await loadChat(copy.id);
        }}
        onDelete={async (id) => {
          try {
            await api.deleteChat(id);
            const list = await loadChats();
            if (id === activeChatId) {
              if (list.length > 0) await loadChat(list[0].id);
              else resetChatSession();
            }
          } catch (err) {
            setSendError(err instanceof Error ? formatApiError(err.message) : "Failed to delete chat");
          }
        }}
        onCreateFolder={async () => {
          const name = prompt("Folder name");
          if (!name?.trim()) return;
          try {
            await api.createChatFolder(name.trim());
            await loadFolders();
          } catch (err) {
            setSendError(err instanceof Error ? formatApiError(err.message) : "Failed to create folder");
          }
        }}
        onRenameFolder={async (id, name) => {
          await api.updateChatFolder(id, name);
          await loadFolders();
        }}
        onDeleteFolder={async (id) => {
          await api.deleteChatFolder(id);
          await loadFolders();
          await loadChats();
        }}
        onMoveChatToFolder={async (chatId, folderId) => {
          await api.updateChat(chatId, { folder_id: folderId });
          await loadChats();
        }}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {user && !user.email_verified && <EmailVerificationBanner email={user.email} />}
        <div
          className="flex items-center gap-2 px-3 py-2.5 md:hidden"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          <button onClick={() => setMobileOpen(true)} className="btn-icon h-9 w-9">
            <Menu size={18} />
          </button>
          <span className="text-sm font-semibold tracking-tight">
            {sidebarTab === "additional-data" ? "Additional Data" : "Chat"}
          </span>
        </div>

        {sidebarTab === "additional-data" ? (
          <AdditionalDataPanel
            item={activeAdditionalData}
            onAddMore={openAppendDataDialog}
            onUpdate={handleUpdateAdditionalData}
            onDelete={handleDeleteAdditionalData}
            onEditingChange={setAdditionalDataEditing}
          />
        ) : activeChatId ? (
          <>
            <ThreadHeader name={chatName} tokenUsed={tokenUsed} tokenLimit={tokenLimit} />
            <div className="relative min-h-0 flex-1">
              <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="absolute inset-0 overflow-y-auto"
              >
                {messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center gap-3">
                    <div
                      className="flex h-14 w-14 items-center justify-center rounded-2xl"
                      style={{ background: "linear-gradient(135deg, var(--accent-from), var(--accent-to))", boxShadow: "var(--shadow-btn)" }}
                    >
                      <span className="text-2xl text-white">✦</span>
                    </div>
                    <p className="text-sm font-medium" style={{ color: "var(--fg-secondary)" }}>
                      Ask anything to get started
                    </p>
                  </div>
                ) : (
                  <MessageList messages={messages} onEdit={handleEdit} />
                )}
              </div>
              {showJumpButton && (
                <div className="pointer-events-none absolute bottom-4 right-4 z-10">
                  <HoverChip label="Jump to present" icon={<ChevronDown size={13} />} placement="top">
                    <button
                      type="button"
                      onClick={() => scrollToBottom("smooth")}
                      aria-label="Jump to present"
                      className="btn-icon pointer-events-auto h-10 w-10 shadow-md"
                    >
                      <ChevronDown size={18} />
                    </button>
                  </HoverChip>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-4">
            <p className="text-sm" style={{ color: "var(--fg-muted)" }}>
              Start a new conversation
            </p>
            <button onClick={handleNewChat} className="btn-primary rounded-xl px-5 py-2.5 text-sm">
              New chat
            </button>
          </div>
        )}

        {sidebarTab === "chats" && (
          <>
            <InputBar
              models={models}
              allowedModels={allowedModels}
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
              additionalData={additionalData}
              selectedAdditionalDataIds={selectedRagDataIds}
              onAdditionalDataChange={handleRagDataChange}
              webSearchEnabled={webSearch}
              canUseWebSearch={canUseWebSearchTier}
              webSearchConfigured={config?.web_search_available ?? false}
              onWebSearchToggle={() => setWebSearch((v) => !v)}
              voiceReplyEnabled={voiceReplyEnabled}
              voiceReplySupported={voiceReplySupported}
              onVoiceReplyToggle={toggleVoiceReply}
              onRegisterVoiceControls={(controls) => {
                voiceControlsRef.current = controls;
              }}
              onSend={handleSend}
              disabled={sending || authLoading}
              initialValue={editInitialValue}
            />
            {sendError && (
              <div className="px-4 pb-3">
                <p
                  className="rounded-xl px-4 py-3 text-sm"
                  style={{
                    background: "rgba(239,68,68,0.1)",
                    color: "#ef4444",
                    border: "1px solid rgba(239,68,68,0.2)",
                  }}
                >
                  {sendError}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      <AdditionalDataDialog
        open={dataDialogOpen}
        mode={dataDialogMode}
        onClose={() => setDataDialogOpen(false)}
        onSave={handleSaveAdditionalData}
      />

      <AuthDialog
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onLogin={login}
        onRegister={register}
      />

      {user && (
        <SettingsDialog
          open={settingsOpen}
          user={user}
          onClose={() => setSettingsOpen(false)}
          onUpdated={() => refresh()}
        />
      )}
    </div>
  );
}
