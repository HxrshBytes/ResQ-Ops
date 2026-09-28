"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { UserRole } from "@/lib/auth";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  badgeId: string;
  role: UserRole;
  agency: string;
  clearanceLevel: string;
  avatar: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (credentials: { email?: string; badgeId?: string; passcode?: string; role?: UserRole }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  quickSwitchRole: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => ({ success: false }),
  logout: async () => {},
  quickSwitchRole: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Check current session on mount
  useEffect(() => {
    fetch("/api/auth")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (credentials: { email?: string; badgeId?: string; passcode?: string; role?: UserRole }) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUser(data.user);
        return { success: true };
      }
      return { success: false, error: data.error || "Authentication failed" };
    } catch {
      return { success: false, error: "Network connection error" };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await fetch("/api/auth", { method: "DELETE" });
      setUser(null);
      window.location.href = "/login";
    } finally {
      setLoading(false);
    }
  };

  const quickSwitchRole = async (role: UserRole) => {
    await login({ role });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, quickSwitchRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
