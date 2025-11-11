"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { DEMO_USERS, demoUserMap, type DemoUserDefinition } from "@/lib/demo-users";

export type DemoUserSelection = DemoUserDefinition;

type DemoAuthContextValue = {
  user: DemoUserSelection | null;
  selectUser: (userId: string) => void;
  clearUser: () => void;
  isLoading: boolean;
};

const DemoAuthContext = createContext<DemoAuthContextValue | undefined>(undefined);

const STORAGE_KEY = "pf-forecast-demo-user";

function resolveStoredUser(value: string | null): DemoUserSelection | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as { id?: string };
    if (!parsed?.id) {
      return null;
    }

    const match = demoUserMap.get(parsed.id);
    return match ?? null;
  } catch (error) {
    console.warn("Unable to parse stored demo user selection.", error);
    return null;
  }
}

export function DemoAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<DemoUserSelection | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const stored = window.localStorage.getItem(STORAGE_KEY);
    const resolved = resolveStoredUser(stored);
    setUser(resolved);
    setIsLoading(false);
  }, []);

  const selectUser = useCallback((userId: string) => {
    const match = demoUserMap.get(userId);

    if (!match) {
      console.warn("Attempted to select an unknown demo user.", userId);
      return;
    }

    setUser(match);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ id: match.id })
      );
    }
  }, []);

  const clearUser = useCallback(() => {
    setUser(null);

    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      selectUser,
      clearUser,
      isLoading,
    }),
    [user, selectUser, clearUser, isLoading]
  );

  return <DemoAuthContext.Provider value={value}>{children}</DemoAuthContext.Provider>;
}

export function useDemoAuth() {
  const context = useContext(DemoAuthContext);

  if (!context) {
    throw new Error("useDemoAuth must be used within a DemoAuthProvider");
  }

  return context;
}

export { DEMO_USERS };
