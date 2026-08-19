"use client";

import { useCallback, useEffect, useState } from "react";
import { api, clearToken, saveToken, User } from "@/lib/api";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const me = await api.me();
      setUser(me);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = async (email: string, password: string) => {
    const res = await api.login(email, password);
    saveToken(res.access_token);
    await refresh();
  };

  const register = async (email: string, username: string, password: string) => {
    const res = await api.register(email, username, password);
    return res.message;
  };

  const logout = () => {
    clearToken();
    setUser(null);
  };

  return { user, loading, login, register, logout, refresh };
}
