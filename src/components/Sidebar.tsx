"use client";

import Image from "next/image";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Database,
  Folder,
  FolderPlus,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { AdditionalDataItem, ChatFolder } from "@/lib/api";
import { Chat, User } from "@/lib/api";
import { UserFooter } from "./UserFooter";

const IASTY_LOGO_WHITE_SRC = "/branding/iasty-logo-white.png";
const IASTY_LOGO_COLOR_SRC = "/branding/iasty-logo.png";
const IASTY_ICON_SRC = "/branding/iasty-icon.png";

export type SidebarTab = "chats" | "additional-data";

interface SidebarProps {
  tab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  chats: Chat[];
  folders: ChatFolder[];
  activeChatId: number | null;
  additionalData: AdditionalDataItem[];
  activeAdditionalDataId: number | null;
  actionsDisabled?: boolean;
  collapsed: boolean;
  mobileOpen: boolean;
  user: User | null;
  onToggleCollapsed: () => void;
  onCloseMobile: () => void;
  onSelectChat: (id: number) => void;
  onNewChat: () => void;
  onSelectAdditionalData: (id: number) => void;
  onAddAdditionalData: () => void;
  onRenameAdditionalData: (id: number, name: string) => void;
  onDuplicateAdditionalData: (id: number) => void;
  onDeleteAdditionalData: (id: number) => void;
  onRename: (id: number, name: string) => void;
  onDuplicate: (id: number) => void;
  onDelete: (id: number) => void;
  onCreateFolder: () => void;
  onRenameFolder: (id: number, name: string) => void;
  onDeleteFolder: (id: number) => void;
  onMoveChatToFolder: (chatId: number, folderId: number | null) => void;
  onLogin: () => void;
  onSettings: () => void;
  onLogout: () => void;
}

export function Sidebar({
  tab,
  onTabChange,
  chats,
  folders,
  activeChatId,
  additionalData,
  activeAdditionalDataId,
  actionsDisabled = false,
  collapsed,
  mobileOpen,
  user,
  onToggleCollapsed,
  onCloseMobile,
  onSelectChat,
  onNewChat,
  onSelectAdditionalData,
  onAddAdditionalData,
  onRenameAdditionalData,
  onDuplicateAdditionalData,
  onDeleteAdditionalData,
  onRename,
  onDuplicate,
  onDelete,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onMoveChatToFolder,
  onLogin,
  onSettings,
  onLogout,
}: SidebarProps) {
  const widthClass = collapsed ? "w-[4.5rem]" : "w-72";
  const mobileClass = mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0";

  return (
    <>
      {mobileOpen && (
        <div className="modal-overlay fixed inset-0 z-40 md:hidden" onClick={onCloseMobile} />
      )}
      <aside
        className={`glass-panel fixed inset-y-0 left-0 z-50 flex flex-col transition-all duration-300 ease-out md:relative md:translate-x-0 ${widthClass} ${mobileClass}`}
        style={{ borderTop: "none", borderBottom: "none", borderLeft: "none", borderRadius: 0 }}
      >
        <div
          className={`relative flex shrink-0 items-center ${
            collapsed ? "flex-col justify-center gap-2 p-2 pt-3" : "h-16 justify-end px-3"
          }`}
        >
          {collapsed ? (
            <>
              <Image
                src={IASTY_ICON_SRC}
                alt=""
                width={40}
                height={40}
                unoptimized
                className="h-10 w-10 object-contain"
                priority
              />
              <button
                type="button"
                onClick={onToggleCollapsed}
                className="btn-icon hidden h-9 w-9 shrink-0 md:inline-flex"
                title="Expand sidebar"
              >
                <ChevronRight size={17} />
              </button>
            </>
          ) : (
            <>
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-12">
                <Image
                  src={IASTY_LOGO_WHITE_SRC}
                  alt=""
                  width={2172}
                  height={724}
                  unoptimized
                  className="hidden h-12 w-auto max-w-[calc(100%-3rem)] object-contain dark:block"
                  priority
                />
                <Image
                  src={IASTY_LOGO_COLOR_SRC}
                  alt=""
                  width={1000}
                  height={250}
                  unoptimized
                  className="h-12 w-auto max-w-[calc(100%-3rem)] object-contain dark:hidden"
                  priority
                />
              </div>
              <button
                type="button"
                onClick={onToggleCollapsed}
                className="btn-icon relative z-10 ml-auto hidden h-9 w-9 shrink-0 md:inline-flex"
                title="Collapse sidebar"
              >
                <ChevronLeft size={17} />
              </button>
            </>
          )}
        </div>

        <div
          className={`shrink-0 pb-3 ${collapsed ? "px-2" : "px-3"}`}
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          <div className="flex flex-col gap-1.5">
            <TabButton
              active={tab === "additional-data"}
              label="Additional Data"
              icon={<Database size={18} />}
              collapsed={collapsed}
              disabled={actionsDisabled}
              onClick={() => onTabChange("additional-data")}
            />
            <TabButton
              active={tab === "chats"}
              label="Chats"
              icon={<MessageSquare size={18} />}
              collapsed={collapsed}
              disabled={actionsDisabled}
              onClick={() => onTabChange("chats")}
            />
          </div>
        </div>

        <div
          className={`flex shrink-0 items-center ${collapsed ? "justify-center p-2" : "justify-between p-4"}`}
        >
          {!collapsed && (
            <div className="flex min-w-0 items-center gap-2">
              {tab === "chats" ? (
                <>
                  <MessageSquare size={18} style={{ color: "var(--accent-from)" }} />
                  <span className="text-sm font-semibold tracking-tight">Chats</span>
                </>
              ) : (
                <>
                  <Database size={18} style={{ color: "var(--accent-from)" }} />
                  <span className="text-sm font-semibold tracking-tight">Additional Data</span>
                </>
              )}
            </div>
          )}
          {tab === "chats" ? (
            <div className="flex items-center gap-1">
              {user && (
                <button
                  type="button"
                  onClick={onCreateFolder}
                  className="btn-icon h-9 w-9"
                  title="New folder"
                >
                  <FolderPlus size={17} />
                </button>
              )}
              <button
                type="button"
                onClick={onNewChat}
                className="btn-icon h-9 w-9"
                title="New chat"
              >
                <Plus size={17} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onAddAdditionalData}
              disabled={actionsDisabled}
              className="btn-icon h-9 w-9 disabled:cursor-not-allowed disabled:opacity-40"
              title="Add new"
            >
              <Plus size={17} />
            </button>
          )}
        </div>

        {!collapsed && tab === "chats" && (
          <ChatListSection
            user={user}
            folders={folders}
            chats={chats}
            activeChatId={activeChatId}
            onSelectChat={(id) => {
              onSelectChat(id);
              onCloseMobile();
            }}
            onRename={onRename}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
            onRenameFolder={onRenameFolder}
            onDeleteFolder={onDeleteFolder}
            onMoveChatToFolder={onMoveChatToFolder}
          />
        )}

        {!collapsed && tab === "additional-data" && (
          <div className="flex flex-1 flex-col overflow-y-auto px-3 pb-2">
            <button
              type="button"
              disabled={actionsDisabled}
              onClick={onAddAdditionalData}
              className="mb-3 flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
              style={{
                background: "color-mix(in srgb, var(--accent-from) 8%, var(--bg-elevated))",
                border: "1px solid color-mix(in srgb, var(--accent-from) 15%, transparent)",
                color: "var(--accent-from)",
              }}
            >
              <Plus size={16} />
              Add new
            </button>
            {additionalData.length === 0 && (
              <p className="px-2 text-xs" style={{ color: "var(--fg-muted)" }}>
                No additional data yet
              </p>
            )}
            {additionalData.map((item) => (
              <AdditionalDataItem
                key={item.id}
                item={item}
                active={item.id === activeAdditionalDataId}
                disabled={actionsDisabled}
                onSelect={() => {
                  onSelectAdditionalData(item.id);
                  onCloseMobile();
                }}
                onRename={onRenameAdditionalData}
                onDuplicate={onDuplicateAdditionalData}
                onDelete={onDeleteAdditionalData}
              />
            ))}
          </div>
        )}

        {collapsed && <div className="flex-1" />}

        <UserFooter
          user={user}
          collapsed={collapsed}
          onLogin={onLogin}
          onSettings={onSettings}
          onLogout={onLogout}
        />
      </aside>
    </>
  );
}

function getMoveTargets(folders: ChatFolder[], currentFolderId: number | null | undefined) {
  const targets: { id: number | null; label: string }[] = [];
  if (currentFolderId != null) {
    targets.push({ id: null, label: "Remove from folder" });
  }
  for (const folder of folders) {
    if (folder.id !== currentFolderId) {
      targets.push({ id: folder.id, label: folder.name });
    }
  }
  return targets;
}

function ChatListSection({
  user,
  folders,
  chats,
  activeChatId,
  onSelectChat,
  onRename,
  onDuplicate,
  onDelete,
  onRenameFolder,
  onDeleteFolder,
  onMoveChatToFolder,
}: {
  user: User | null;
  folders: ChatFolder[];
  chats: Chat[];
  activeChatId: number | null;
  onSelectChat: (id: number) => void;
  onRename: (id: number, name: string) => void;
  onDuplicate: (id: number) => void;
  onDelete: (id: number) => void;
  onRenameFolder: (id: number, name: string) => void;
  onDeleteFolder: (id: number) => void;
  onMoveChatToFolder: (chatId: number, folderId: number | null) => void;
}) {
  const [collapsedFolders, setCollapsedFolders] = useState<Set<number>>(new Set());
  const folderIds = new Set(folders.map((folder) => folder.id));
  const uncategorized = chats.filter((chat) => !chat.folder_id || !folderIds.has(chat.folder_id));
  const showFolders = Boolean(user) && folders.length > 0;

  const toggleFolder = (folderId: number) => {
    setCollapsedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  };

  return (
    <div className="flex-1 overflow-y-auto px-3 pb-2">
      {showFolders &&
        folders.map((folder) => {
          const folderChats = chats.filter((chat) => chat.folder_id === folder.id);
          const collapsed = collapsedFolders.has(folder.id);

          return (
            <div key={folder.id} className="mb-2">
              <FolderRow
                folder={folder}
                chatCount={folderChats.length}
                collapsed={collapsed}
                onToggle={() => toggleFolder(folder.id)}
                onRename={onRenameFolder}
                onDelete={onDeleteFolder}
              />
              {!collapsed &&
                folderChats.map((chat) => (
                  <ChatItem
                    key={chat.id}
                    chat={chat}
                    active={chat.id === activeChatId}
                    indented
                    moveTargets={getMoveTargets(folders, chat.folder_id)}
                    onSelect={() => onSelectChat(chat.id)}
                    onRename={onRename}
                    onDuplicate={onDuplicate}
                    onDelete={onDelete}
                    onMoveToFolder={(folderId) => onMoveChatToFolder(chat.id, folderId)}
                  />
                ))}
              {!collapsed && folderChats.length === 0 && (
                <p className="mb-1 pl-6 pr-2 text-xs" style={{ color: "var(--fg-muted)" }}>
                  Empty folder
                </p>
              )}
            </div>
          );
        })}

      {(uncategorized.length > 0 || !showFolders) && (
        <>
          <div
            className="mb-3 px-2 text-[0.6875rem] font-semibold uppercase tracking-widest"
            style={{ color: "var(--fg-muted)" }}
          >
            {showFolders ? "Uncategorized" : "Recent"}
          </div>
          {uncategorized.length === 0 && !showFolders && (
            <p className="px-2 text-xs" style={{ color: "var(--fg-muted)" }}>
              No conversations yet
            </p>
          )}
          {uncategorized.map((chat) => (
            <ChatItem
              key={chat.id}
              chat={chat}
              active={chat.id === activeChatId}
              moveTargets={user ? getMoveTargets(folders, chat.folder_id) : undefined}
              onSelect={() => onSelectChat(chat.id)}
              onRename={onRename}
              onDuplicate={onDuplicate}
              onDelete={onDelete}
              onMoveToFolder={
                user ? (folderId) => onMoveChatToFolder(chat.id, folderId) : undefined
              }
            />
          ))}
        </>
      )}

      {showFolders && uncategorized.length === 0 && chats.length === 0 && (
        <p className="px-2 text-xs" style={{ color: "var(--fg-muted)" }}>
          No conversations yet
        </p>
      )}
    </div>
  );
}

function FolderRow({
  folder,
  chatCount,
  collapsed,
  onToggle,
  onRename,
  onDelete,
}: {
  folder: ChatFolder;
  chatCount: number;
  collapsed: boolean;
  onToggle: () => void;
  onRename: (id: number, name: string) => void;
  onDelete: (id: number) => void;
}) {
  const [menu, setMenu] = useState<ItemMenuState>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useItemMenuDismiss(menuRef, menu, () => setMenu(null));

  const openContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setMenu({ type: "fixed", x: e.clientX, y: e.clientY });
  };

  const openAnchorMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenu({ type: "anchor" });
  };

  return (
    <div
      onContextMenu={openContextMenu}
      className="group relative mb-1 flex items-center rounded-xl px-2 py-2 text-sm"
      style={{ background: "color-mix(in srgb, var(--fg-primary) 4%, transparent)" }}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
      >
        {collapsed ? (
          <ChevronRight size={14} style={{ color: "var(--fg-muted)" }} />
        ) : (
          <ChevronDown size={14} style={{ color: "var(--fg-muted)" }} />
        )}
        <Folder size={15} style={{ color: "var(--accent-from)" }} />
        <span className="truncate font-medium" style={{ color: "var(--fg-secondary)" }}>
          {folder.name}
        </span>
        <span className="text-xs" style={{ color: "var(--fg-muted)" }}>
          {chatCount}
        </span>
      </button>
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={openAnchorMenu}
          className="btn-ghost rounded-md p-1 opacity-0 group-hover:opacity-100"
          aria-label="Folder actions"
        >
          <MoreHorizontal size={15} />
        </button>
        {menu && (
          <ItemActionMenu
            menu={menu}
            onClose={() => setMenu(null)}
            renameLabel="Rename folder"
            deleteConfirm="Delete this folder? Chats will stay in your list."
            onRename={() => {
              const name = prompt("Folder name", folder.name);
              if (name?.trim()) onRename(folder.id, name.trim());
            }}
            onDuplicate={() => {}}
            showDuplicate={false}
            onDelete={() => onDelete(folder.id)}
          />
        )}
      </div>
    </div>
  );
}

function TabButton({
  active,
  label,
  icon,
  collapsed = false,
  disabled,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: React.ReactNode;
  collapsed?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={`sidebar-tab ${active ? "active" : ""} ${collapsed ? "sidebar-tab-collapsed" : ""}`}
    >
      <span className="sidebar-tab-icon" style={{ color: active ? "var(--accent-from)" : "inherit" }}>
        {icon}
      </span>
      {!collapsed && <span className="min-w-0 truncate">{label}</span>}
    </button>
  );
}

function AdditionalDataItem({
  item,
  active,
  disabled,
  onSelect,
  onRename,
  onDuplicate,
  onDelete,
}: {
  item: AdditionalDataItem;
  active: boolean;
  disabled?: boolean;
  onSelect: () => void;
  onRename: (id: number, name: string) => void;
  onDuplicate: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  const [menu, setMenu] = useState<ItemMenuState>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useItemMenuDismiss(menuRef, menu, () => setMenu(null));

  const openContextMenu = (e: React.MouseEvent) => {
    if (disabled) return;
    e.preventDefault();
    setMenu({ type: "fixed", x: e.clientX, y: e.clientY });
  };

  const openAnchorMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    setMenu({ type: "anchor" });
  };

  const closeMenu = () => setMenu(null);

  return (
    <div
      onContextMenu={openContextMenu}
      className={`chat-item group relative mb-1 flex items-center px-3 py-2.5 text-sm ${
        active ? "active" : ""
      } ${disabled ? "opacity-40" : ""}`}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={onSelect}
        className="min-w-0 flex-1 truncate text-left font-medium disabled:cursor-not-allowed"
        style={{ color: active ? "var(--accent-from)" : "var(--fg-secondary)" }}
      >
        {item.name}
      </button>
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          disabled={disabled}
          onClick={openAnchorMenu}
          className="btn-ghost rounded-md p-1 opacity-0 group-hover:opacity-100 disabled:cursor-not-allowed"
          aria-label="Additional data actions"
        >
          <MoreHorizontal size={15} />
        </button>
        {menu && (
          <ItemActionMenu
            menu={menu}
            onClose={closeMenu}
            renameLabel="Rename"
            deleteConfirm={`Delete "${item.name}"? This cannot be undone.`}
            onRename={() => {
              const name = prompt("Additional data name", item.name);
              if (name?.trim()) onRename(item.id, name.trim());
            }}
            onDuplicate={() => onDuplicate(item.id)}
            onDelete={() => onDelete(item.id)}
          />
        )}
      </div>
    </div>
  );
}

function ChatItem({
  chat,
  active,
  indented = false,
  moveTargets,
  onSelect,
  onRename,
  onDuplicate,
  onDelete,
  onMoveToFolder,
}: {
  chat: Chat;
  active: boolean;
  indented?: boolean;
  moveTargets?: { id: number | null; label: string }[];
  onSelect: () => void;
  onRename: (id: number, name: string) => void;
  onDuplicate: (id: number) => void;
  onDelete: (id: number) => void;
  onMoveToFolder?: (folderId: number | null) => void;
}) {
  const [menu, setMenu] = useState<ItemMenuState>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useItemMenuDismiss(menuRef, menu, () => setMenu(null));

  const openContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setMenu({ type: "fixed", x: e.clientX, y: e.clientY });
  };

  const openAnchorMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenu({ type: "anchor" });
  };

  const closeMenu = () => setMenu(null);

  return (
    <div
      onContextMenu={openContextMenu}
      className={`chat-item group relative mb-1 flex items-center py-2.5 text-sm ${indented ? "pl-6 pr-3" : "px-3"} ${active ? "active" : ""}`}
    >
      <button
        type="button"
        onClick={onSelect}
        className="min-w-0 flex-1 truncate text-left font-medium"
        style={{ color: active ? "var(--accent-from)" : "var(--fg-secondary)" }}
      >
        {chat.name}
      </button>
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={openAnchorMenu}
          className="btn-ghost rounded-md p-1 opacity-0 group-hover:opacity-100"
          aria-label="Chat actions"
        >
          <MoreHorizontal size={15} />
        </button>
        {menu && (
          <ItemActionMenu
            menu={menu}
            onClose={closeMenu}
            renameLabel="Edit name"
            deleteConfirm="Delete this chat?"
            onRename={() => {
              const name = prompt("Chat name", chat.name);
              if (name?.trim()) onRename(chat.id, name.trim());
            }}
            onDuplicate={() => onDuplicate(chat.id)}
            onDelete={() => onDelete(chat.id)}
            moveTargets={moveTargets}
            onMoveToFolder={onMoveToFolder}
          />
        )}
      </div>
    </div>
  );
}

type ItemMenuState = { type: "anchor" } | { type: "fixed"; x: number; y: number } | null;

function useItemMenuDismiss(
  menuRef: React.RefObject<HTMLDivElement | null>,
  menu: ItemMenuState,
  onClose: () => void
) {
  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [menu, menuRef, onClose]);
}

function ItemActionMenu({
  menu,
  onClose,
  renameLabel,
  deleteConfirm,
  onRename,
  onDuplicate,
  onDelete,
  showDuplicate = true,
  moveTargets,
  onMoveToFolder,
}: {
  menu: Exclude<ItemMenuState, null>;
  onClose: () => void;
  renameLabel: string;
  deleteConfirm: string;
  onRename: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  showDuplicate?: boolean;
  moveTargets?: { id: number | null; label: string }[];
  onMoveToFolder?: (folderId: number | null) => void;
}) {
  const menuClass =
    menu.type === "fixed"
      ? "dropdown-menu fixed z-[100] w-44 py-1"
      : "dropdown-menu absolute right-0 top-full z-10 mt-1 w-44 py-1";

  const menuStyle = menu.type === "fixed" ? { left: menu.x, top: menu.y } : undefined;
  const showMove = Boolean(moveTargets?.length && onMoveToFolder);

  return (
    <div
      className={menuClass}
      style={menuStyle}
      onContextMenu={(e) => e.preventDefault()}
    >
      <MenuButton
        icon={<Pencil size={14} />}
        label={renameLabel}
        onClick={() => {
          onRename();
          onClose();
        }}
      />
      {showDuplicate && (
        <MenuButton
          icon={<Copy size={14} />}
          label="Duplicate"
          onClick={() => {
            onDuplicate();
            onClose();
          }}
        />
      )}
      {showMove && (
        <>
          <div
            className="my-1"
            style={{ borderTop: "1px solid var(--border-subtle)" }}
          />
          {moveTargets!.map((target) => (
            <MenuButton
              key={target.id ?? "none"}
              icon={<Folder size={14} />}
              label={target.label}
              onClick={() => {
                onMoveToFolder!(target.id);
                onClose();
              }}
            />
          ))}
        </>
      )}
      <MenuButton
        icon={<Trash2 size={14} />}
        label="Delete"
        onClick={() => {
          if (confirm(deleteConfirm)) onDelete();
          onClose();
        }}
        danger
      />
    </div>
  );
}

function MenuButton({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="dropdown-item"
      style={danger ? { color: "#ef4444" } : undefined}
    >
      {icon}
      {label}
    </button>
  );
}
