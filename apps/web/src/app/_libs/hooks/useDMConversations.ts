"use client";

import { createClient } from "@/app/_libs/supabase/client";
import { env } from "env";
import {
  useDMConversations as _useDMConversations,
  fetchDMConversations as _fetchDMConversations,
} from "@kurate/hooks";

const supabase = createClient();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;

export function useDMConversations(userId: string | null) {
  return _useDMConversations(supabase, supabaseUrl, userId);
}

export async function fetchDMConversations(userId: string) {
  return _fetchDMConversations(supabase, supabaseUrl, userId);
}
