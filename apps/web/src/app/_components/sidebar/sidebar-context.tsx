"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

export interface SidebarContextValue {
  activeChatHandle: string | null | undefined;
  onPersonClick: ((handle: string) => void) | undefined;
  markRead: ((convoId: string) => Promise<void>) | undefined;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function SidebarProvider({
  activeChatHandle,
  onPersonClick,
  markRead,
  children,
}: SidebarContextValue & { children: ReactNode }) {
  const value = useMemo(
    () => ({ activeChatHandle, onPersonClick, markRead }),
    [activeChatHandle, onPersonClick, markRead],
  );
  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

export function useSidebarContext(): SidebarContextValue {
  const ctx = useContext(SidebarContext);
  if (!ctx) {
    throw new Error("useSidebarContext must be used within SidebarProvider");
  }
  return ctx;
}

export function useSidebarContextOptional(): SidebarContextValue | null {
  return useContext(SidebarContext);
}
