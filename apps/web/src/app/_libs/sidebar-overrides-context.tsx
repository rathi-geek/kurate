"use client";

import { createContext, useCallback, useContext, useEffect } from "react";

/**
 * Optional sidebar props that route-level pages can inject (e.g. chat page).
 * Base props (userEmail, onLogout) come from AppShell.
 */
export interface SidebarOverrides {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  onPersonClick?: (handle: string) => void;
  onGroupChatClick?: (groupName: string) => void;
  activeChatHandle?: string | null;
}

interface SidebarOverridesContextValue {
  setOverrides: (overrides: SidebarOverrides) => void;
}

const SidebarOverridesContext = createContext<SidebarOverridesContextValue | null>(null);

export function SidebarOverridesProvider({
  children,
  setOverrides,
}: {
  children: React.ReactNode;
  setOverrides: (o: SidebarOverrides) => void;
}) {
  const value = useCallback(
    (next: SidebarOverrides) => setOverrides(next),
    [setOverrides],
  );
  return (
    <SidebarOverridesContext.Provider value={{ setOverrides: value }}>
      {children}
    </SidebarOverridesContext.Provider>
  );
}

export function useSidebarOverridesContext(): SidebarOverridesContextValue | null {
  return useContext(SidebarOverridesContext);
}

/**
 * Call from a page (e.g. chat) to inject sidebar overrides. Clears on unmount.
 * Pass a stable or memoized overrides object to avoid unnecessary effect runs.
 */
export function useSidebarOverrides(overrides: SidebarOverrides): void {
  const ctx = useSidebarOverridesContext();
  useEffect(() => {
    if (!ctx) return;
    ctx.setOverrides(overrides);
    return () => ctx.setOverrides({});
  }, [ctx, overrides]);
}
