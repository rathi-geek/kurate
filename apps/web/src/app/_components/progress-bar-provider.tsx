"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// ─── Inner component (needs Suspense for useSearchParams) ─────────────────────

function ProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 3-phase state machine: idle → loading → completing → idle
  const [phase, setPhase] = useState<"idle" | "loading" | "completing">("idle");
  // Separate width state so we can trigger the CSS transition after mount
  const [width, setWidth] = useState(0);

  const pathRef = useRef(pathname + searchParams.toString());
  const cleanupRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Intercept anchor clicks → start the bar
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      const href = anchor.getAttribute("href") ?? "";
      if (!href || href.startsWith("#") || anchor.target === "_blank") return;
      if (/^https?:\/\//.test(href) && !href.startsWith(window.location.origin)) return;

      // Clear any pending cleanup
      if (cleanupRef.current) clearTimeout(cleanupRef.current);

      setPhase("loading");
      setWidth(0); // reset to 0 first so the transition plays from the start
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  // Once phase="loading" and width=0 is committed, animate to 75%
  useEffect(() => {
    if (phase === "loading" && width === 0) {
      // Double RAF ensures the browser has painted width:0 before transitioning
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setWidth(75);
        });
      });
      return () => cancelAnimationFrame(id);
    }
  }, [phase, width]);

  // Detect route change → complete the bar
  useEffect(() => {
    const current = pathname + searchParams.toString();
    if (current === pathRef.current) return;
    pathRef.current = current;

    if (phase === "loading") {
      setPhase("completing");
      setWidth(100);

      cleanupRef.current = setTimeout(() => {
        setPhase("idle");
        setWidth(0);
      }, 450); // enough time for width + opacity transition
    }
  }, [pathname, searchParams, phase]);

  if (phase === "idle") return null;

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "2px",
        zIndex: 99999,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          height: "100%",
          backgroundColor: "#1a5c4b",
          width: `${width}%`,
          opacity: phase === "completing" ? 0 : 1,
          transition:
            phase === "loading"
              ? "width 8s cubic-bezier(0.05, 0.8, 0.5, 1)" // slow crawl toward 75%
              : "width 200ms ease-in, opacity 250ms ease-in 200ms", // snap to 100%, then fade
        }}
      />
    </div>
  );
}

// ─── Public export ────────────────────────────────────────────────────────────

export function ProgressBarProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Suspense fallback={null}>
        <ProgressBar />
      </Suspense>
    </>
  );
}
