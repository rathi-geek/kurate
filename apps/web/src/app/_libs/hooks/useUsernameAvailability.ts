"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/app/_libs/supabase/client";
import { validateUsername } from "@kurate/utils";

export type HandleStatus = "idle" | "checking" | "available" | "taken";

export function useUsernameAvailability(username: string, currentHandle?: string) {
  const [status, setStatus] = useState<HandleStatus>("idle");

  useEffect(() => {
    const trimmed = username.trim();
    if (!trimmed || validateUsername(trimmed) !== null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- synchronous reset before async check is intentional
      setStatus("idle");
      return;
    }
    if (trimmed === currentHandle) {
      setStatus("available");
      return;
    }
    const timer = setTimeout(async () => {
      setStatus("checking");
      const supabase = createClient();
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("handle", trimmed)
        .maybeSingle();
      setStatus(data ? "taken" : "available");
    }, 500);
    return () => clearTimeout(timer);
  }, [username, currentHandle]);

  return { status, setStatus };
}
