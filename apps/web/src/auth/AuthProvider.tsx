"use client";
import type { PublicUser } from "@ft/core";
import { createContext, type ReactNode, useCallback, useContext, useState } from "react";
import { fetchMe } from "./api";

export interface AuthState {
  user: PublicUser | null;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({
  initialUser,
  children,
}: {
  initialUser: PublicUser | null;
  children: ReactNode;
}) {
  const [user, setUser] = useState(initialUser);

  const refresh = useCallback(async () => {
    try {
      setUser(await fetchMe());
    } catch {
      setUser(null);
    }
  }, []);

  return <AuthContext.Provider value={{ user, refresh }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const state = useContext(AuthContext);
  if (!state) {
    throw new Error("useAuth() needs an <AuthProvider> above it");
  }
  return state;
}