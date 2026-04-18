"use client";

import {
  useRefreshLoggedItem as useRefreshLoggedItemShared,
  type RefreshableItem,
} from "@kurate/hooks";

import { createClient } from "@/app/_libs/supabase/client";

const supabase = createClient();

/**
 * Web wrapper — injects supabase client, uses relative URL (empty apiBaseUrl),
 * and no access token (web uses cookies).
 */
export function useRefreshLoggedItem(
  item: RefreshableItem | null | undefined,
) {
  return useRefreshLoggedItemShared(item, supabase);
}
