"use client";

import { createClient } from "@/app/_libs/supabase/client";
import { env } from "env";
import {
  useMessages as _useMessages,
  fetchMessages as _fetchMessages,
} from "@kurate/hooks";

const supabase = createClient();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;

export function useMessages(convoId: string | null) {
  return _useMessages(supabase, supabaseUrl, convoId);
}

export async function fetchMessages(convoId: string, before?: string) {
  return _fetchMessages(supabase, supabaseUrl, convoId, before);
}
