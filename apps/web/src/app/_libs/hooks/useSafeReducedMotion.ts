"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

/**
 * SSR-safe wrapper around framer-motion's useReducedMotion.
 *
 * useReducedMotion() returns `null` on the server and the real boolean on the
 * client. Branching on null vs true/false in JSX props causes React hydration
 * mismatches (observed on iOS Safari with "Reduce Motion" enabled).
 *
 * This hook returns `false` on both server and the initial client render so the
 * two match, then updates to the real preference after mount.
 */
export function useSafeReducedMotion(): boolean {
  const prefersReducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  return mounted ? (prefersReducedMotion ?? false) : false;
}
