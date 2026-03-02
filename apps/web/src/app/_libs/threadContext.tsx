"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export interface ShareContentPayload {
  url: string;
  title: string;
  source: string;
  image?: string | null;
  contentType?: string;
  readTime?: string | null;
  description?: string | null;
}

interface ThreadContextValue {
  activeThreadId: string | null;
  isFullScreen: boolean;
  isInfoOpen: boolean;
  activePersonHandle: string | null;
  openThread: (threadId: string) => void;
  closeThread: () => void;
  toggleFullScreen: () => void;
  toggleInfo: () => void;
  closeInfo: () => void;
  openPerson: (handle: string) => void;
  closePerson: () => void;
  shareContent: ShareContentPayload | null;
  startShare: (payload: ShareContentPayload) => void;
  cancelShare: () => void;
}

const ThreadContext = createContext<ThreadContextValue | null>(null);

export function ThreadProvider({ children }: { children: ReactNode }) {
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [activePersonHandle, setActivePersonHandle] = useState<string | null>(null);
  const [shareContent, setShareContent] = useState<ShareContentPayload | null>(null);

  const openThread = useCallback((threadId: string) => {
    setActiveThreadId(threadId);
    setIsInfoOpen(false);
  }, []);

  const closeThread = useCallback(() => {
    setActiveThreadId(null);
    setIsFullScreen(false);
    setIsInfoOpen(false);
  }, []);

  const openPerson = useCallback((handle: string) => {
    setActivePersonHandle(handle);
    setActiveThreadId(null);
    setIsFullScreen(false);
    setIsInfoOpen(false);
  }, []);

  const closePerson = useCallback(() => {
    setActivePersonHandle(null);
    setActiveThreadId(null);
    setIsFullScreen(false);
    setIsInfoOpen(false);
  }, []);

  const toggleFullScreen = useCallback(() => setIsFullScreen((p) => !p), []);
  const toggleInfo = useCallback(() => setIsInfoOpen((p) => !p), []);
  const closeInfo = useCallback(() => setIsInfoOpen(false), []);
  const startShare = useCallback((payload: ShareContentPayload) => setShareContent(payload), []);
  const cancelShare = useCallback(() => setShareContent(null), []);

  return (
    <ThreadContext.Provider
      value={{
        activeThreadId,
        isFullScreen,
        isInfoOpen,
        activePersonHandle,
        openThread,
        closeThread,
        toggleFullScreen,
        toggleInfo,
        closeInfo,
        openPerson,
        closePerson,
        shareContent,
        startShare,
        cancelShare,
      }}
    >
      {children}
    </ThreadContext.Provider>
  );
}

export function useThread() {
  const ctx = useContext(ThreadContext);
  if (!ctx) throw new Error("useThread must be used within <ThreadProvider>");
  return ctx;
}
