"use client";

import { useEffect } from "react";

/**
 * Detects when an auth page is restored from the browser's back/forward cache (bfcache)
 * and forces a hard reload so proxy.ts can redirect authenticated users away.
 *
 * Without this, pressing Back after login can show a stale cached auth page
 * even though the server would redirect the user to /home.
 */
export function BfcacheGuard() {
  useEffect(() => {
    function handlePageShow(e: PageTransitionEvent) {
      if (e.persisted) {
        window.location.reload();
      }
    }
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  return null;
}
