"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { useDemoAuth } from "@/components/demo-auth-provider";

type DashboardContextValue = {
  isOpen: boolean;
  hasSeen: boolean;
  isReady: boolean;
  openDashboard: () => void;
  closeDashboard: () => void;
  resetDashboardSession: () => void;
};

const DashboardContext = createContext<DashboardContextValue | undefined>(undefined);

const STORAGE_PREFIX = "pf-dashboard-session";

function getStorageKey(userId: string) {
  return `${STORAGE_PREFIX}:${userId}`;
}

export function DashboardProvider({ children }: { children: ReactNode }) {
  const { user } = useDemoAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [hasSeen, setHasSeen] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [storageKey, setStorageKey] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setStorageKey(null);
      setHasSeen(false);
      setIsOpen(false);
      setIsReady(true);
      return;
    }

    setIsReady(false);
    const key = getStorageKey(user.id);
    setStorageKey(key);

    if (typeof window === "undefined") {
      setHasSeen(true);
      setIsOpen(false);
      setIsReady(true);
      return;
    }

    const stored = window.sessionStorage.getItem(key);
    const previouslySeen = stored === "true";
    setHasSeen(previouslySeen);
    setIsOpen(!previouslySeen);
    setIsReady(true);
  }, [user?.id, user]);

  const markSeen = useCallback(() => {
    if (!storageKey || typeof window === "undefined") {
      return;
    }

    window.sessionStorage.setItem(storageKey, "true");
    setHasSeen(true);
  }, [storageKey]);

  const openDashboard = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeDashboard = useCallback(() => {
    setIsOpen(false);
    markSeen();
  }, [markSeen]);

  const resetDashboardSession = useCallback(() => {
    if (storageKey && typeof window !== "undefined") {
      window.sessionStorage.removeItem(storageKey);
    }

    setHasSeen(false);
  }, [storageKey]);

  const value = useMemo(
    () => ({
      isOpen,
      hasSeen,
      isReady,
      openDashboard,
      closeDashboard,
      resetDashboardSession,
    }),
    [isOpen, hasSeen, isReady, openDashboard, closeDashboard, resetDashboardSession],
  );

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboard() {
  const context = useContext(DashboardContext);

  if (!context) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }

  return context;
}
