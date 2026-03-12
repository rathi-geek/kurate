"use client";

import { useEffect, useRef, useState } from "react";

export type ScrollDir = "up" | "down" | null;

/**
 * Tracks scroll direction of a given scroll container ref.
 * Returns "down" when scrolling toward bottom, "up" when scrolling back,
 * null before first scroll event.
 *
 * Guards:
 * - Resets to "up" when at top (scrollTop <= 0)
 * - No-op when scrollable range < MIN_SCROLL_PX (prevents layout feedback loop)
 * - Only fires "down" when user has scrolled ≥ 15% of the scrollable range
 * - 500 ms cooldown after going "down" — covers spring settle time (~340 ms) to prevent flicker
 */

const MIN_SCROLL_PX = 80;

export function useScrollDirection(
  ref: React.RefObject<HTMLElement | null>,
  threshold = 8,
): ScrollDir {
  const [direction, setDirection] = useState<ScrollDir>(null);
  const lastY = useRef(0);
  const downCooldownUntil = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handler = () => {
      const y = el.scrollTop;
      const maxScrollTop = el.scrollHeight - el.clientHeight;

      // Always show UI when at top
      if (y <= 0) {
        setDirection("up");
        lastY.current = 0;
        downCooldownUntil.current = 0;
        return;
      }

      const delta = y - lastY.current;
      if (Math.abs(delta) < threshold) return;

      if (delta > 0) {
        // Not enough scrollable space — never hide (prevents layout feedback loop)
        if (maxScrollTop < MIN_SCROLL_PX) {
          lastY.current = y;
          return;
        }

        // Only hide after scrolling ≥ 15% of the scrollable range (not total height)
        const scrolledFraction = y / maxScrollTop;
        if (scrolledFraction < 0.15) {
          setDirection("up");
          lastY.current = y;
          return;
        }

        setDirection("down");
        downCooldownUntil.current = Date.now() + 500; // extended: covers spring settle (~340 ms)
      } else {
        // Scrolling up — ignore if within cooldown window (animation-triggered clamping)
        if (Date.now() < downCooldownUntil.current) {
          lastY.current = y;
          return;
        }

        setDirection("up");
      }

      lastY.current = y;
    };

    el.addEventListener("scroll", handler, { passive: true });
    return () => el.removeEventListener("scroll", handler);
  }, [ref, threshold]);

  return direction;
}
