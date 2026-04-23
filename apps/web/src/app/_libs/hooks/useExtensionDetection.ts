"use client";

import { useEffect, useRef, useState } from "react";

const EXTENSION_ID =
  process.env.NEXT_PUBLIC_EXTENSION_ID ?? "ljljjongakpideellcpanddcplljonca";
const POLL_INTERVAL_MS = 2000;

type ChromeLike = {
  runtime: {
    sendMessage: (
      id: string,
      msg: unknown,
      cb: (res: unknown) => void,
    ) => void;
    lastError?: { message?: string };
  };
};

function getChromeRuntime(): ChromeLike["runtime"] | null {
  if (typeof window === "undefined") return null;
  const c = (window as unknown as { chrome?: ChromeLike }).chrome;
  return c?.runtime ?? null;
}

function pingExtension(): Promise<boolean> {
  return new Promise((resolve) => {
    const rt = getChromeRuntime();
    if (!rt) { resolve(false); return; }
    try {
      rt.sendMessage(EXTENSION_ID, { type: "KURATE_PING" }, (res) => {
        if (rt.lastError) { resolve(false); return; }
        resolve((res as { type?: string })?.type === "KURATE_PONG");
      });
    } catch {
      resolve(false);
    }
  });
}

export function isChromiumBrowser(): boolean {
  return getChromeRuntime() !== null;
}

export function useExtensionDetection(active: boolean) {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!active) return;

    const check = async () => {
      const ok = await pingExtension();
      if (ok) {
        setIsInstalled(true);
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    };

    void check();
    intervalRef.current = setInterval(check, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [active]);

  function onInstallClick() {
    setIsWaiting(true);
  }

  return { isInstalled, isWaiting, onInstallClick };
}
