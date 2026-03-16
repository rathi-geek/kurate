"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

export interface SidebarContextValue {
  activeChatHandle: string | null | undefined;
  onPersonClick: ((handle: string) => void) | undefined;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function SidebarProvider({
  activeChatHandle,
  onPersonClick,
  children,
}: SidebarContextValue & { children: ReactNode }) {
  const value = useMemo(
    () => ({ activeChatHandle, onPersonClick }),
    [activeChatHandle, onPersonClick],
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
