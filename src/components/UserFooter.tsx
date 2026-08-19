"use client";

import Link from "next/link";
import { LogOut, MoreHorizontal, Settings, Shield } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { User } from "@/lib/api";

interface UserFooterProps {
  user: User | null;
  collapsed?: boolean;
  onLogin: () => void;
  onSettings: () => void;
  onLogout: () => void;
}

export function UserFooter({
  user,
  collapsed = false,
  onLogin,
  onSettings,
  onLogout,
}: UserFooterProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLButtonElement>(null);
  const [menuPos, setMenuPos] = useState<{ left: number; bottom: number } | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!menuOpen || !collapsed) return;

    const updatePosition = () => {
      if (!avatarRef.current) return;
      const rect = avatarRef.current.getBoundingClientRect();
      setMenuPos({
        left: rect.right + 8,
        bottom: window.innerHeight - rect.bottom,
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [menuOpen, collapsed]);

  const toggleCollapsedMenu = () => {
    if (menuOpen) {
      setMenuOpen(false);
      return;
    }
    if (avatarRef.current) {
      const rect = avatarRef.current.getBoundingClientRect();
      setMenuPos({
        left: rect.right + 8,
        bottom: window.innerHeight - rect.bottom,
      });
    }
    setMenuOpen(true);
  };

  if (!user) {
    return (
      <div className="p-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
        <button
          onClick={onLogin}
          className={`btn-primary ${collapsed ? "flex h-10 w-10 items-center justify-center rounded-xl p-0" : "w-full rounded-xl py-2.5"} text-sm`}
          title="Login"
        >
          {collapsed ? "→" : "Sign in"}
        </button>
      </div>
    );
  }

  const planLabel = user.plan === "plus" ? "Plus" : "Free";
  const initials = user.username.slice(0, 1).toUpperCase();

  if (collapsed) {
    return (
      <div className="relative p-2" style={{ borderTop: "1px solid var(--border-subtle)" }} ref={menuRef}>
        <button
          ref={avatarRef}
          onClick={toggleCollapsedMenu}
          className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl text-sm font-semibold text-white"
          style={{ background: "linear-gradient(135deg, var(--accent-from), var(--accent-to))", boxShadow: "var(--shadow-btn)" }}
          title={user.username}
        >
          {initials}
        </button>
        {menuOpen && menuPos && (
          <UserMenu
            username={user.username}
            isAdmin={user.is_admin}
            onSettings={onSettings}
            onLogout={onLogout}
            onClose={() => setMenuOpen(false)}
            className="dropdown-menu fixed z-[100] w-48 py-1"
            style={{ left: menuPos.left, bottom: menuPos.bottom }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="relative p-3" style={{ borderTop: "1px solid var(--border-subtle)" }} ref={menuRef}>
      <div className="surface-inset flex items-center gap-3 rounded-xl p-2.5">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-semibold text-white"
          style={{ background: "linear-gradient(135deg, var(--accent-from), var(--accent-to))" }}
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{user.username}</div>
          <span className="badge mt-0.5">{planLabel}</span>
        </div>
        <button onClick={() => setMenuOpen(!menuOpen)} className="btn-ghost rounded-lg p-1.5">
          <MoreHorizontal size={17} />
        </button>
      </div>

      {menuOpen && (
        <UserMenu
          username={user.username}
          isAdmin={user.is_admin}
          onSettings={onSettings}
          onLogout={onLogout}
          onClose={() => setMenuOpen(false)}
          className="dropdown-menu absolute bottom-full left-3 right-3 mb-2 py-1"
        />
      )}
    </div>
  );
}

function UserMenu({
  username,
  isAdmin,
  onSettings,
  onLogout,
  onClose,
  className,
  style,
}: {
  username: string;
  isAdmin: boolean;
  onSettings: () => void;
  onLogout: () => void;
  onClose: () => void;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={className} style={style}>
      <div
        className="px-3 py-2.5 text-sm font-semibold"
        style={{ borderBottom: "1px solid var(--border-subtle)", color: "var(--fg-primary)" }}
      >
        {username}
      </div>
      {isAdmin && (
        <Link href="/admin" onClick={onClose} className="dropdown-item">
          <Shield size={15} />
          Admin panel
        </Link>
      )}
      <button
        onClick={() => {
          onSettings();
          onClose();
        }}
        className="dropdown-item"
      >
        <Settings size={15} />
        Settings
      </button>
      <button
        onClick={() => {
          onLogout();
          onClose();
        }}
        className="dropdown-item"
      >
        <LogOut size={15} />
        Log out
      </button>
    </div>
  );
}
