"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

import type { Contact } from "@/app/_libs/contacts";

export interface SidebarContextValue {
  contacts: Contact[];
  activeChatHandle: string | null | undefined;
  onPersonClick: ((handle: string) => void) | undefined;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function SidebarProvider({
  contacts,
  activeChatHandle,
  onPersonClick,
  children,
}: SidebarContextValue & { children: ReactNode }) {
  const value = useMemo(
    () => ({ contacts, activeChatHandle, onPersonClick }),
    [contacts, activeChatHandle, onPersonClick],
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
