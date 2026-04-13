"use client";

import { useVaultToggle as _useVaultToggle } from "@kurate/hooks";

import { createClient } from "@/app/_libs/supabase/client";

const supabase = createClient();

export function useVaultToggle(userId: string, url: string, groupId?: string | null) {
  return _useVaultToggle(supabase, userId, url, groupId);
}
