"use client";

import { useEffect, useRef } from "react";

export function useAutoMarkRead(
  active: boolean,
  unreadCount: number,
  markAllRead: () => Promise<void>,
  delay = 1500,
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (active && unreadCount > 0) {
      timerRef.current = setTimeout(() => {
        void markAllRead();
      }, delay);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);
}
