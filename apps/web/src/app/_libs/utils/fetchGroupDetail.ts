import type { Tables } from "@kurate/types";

import { createClient } from "@/app/_libs/supabase/client";

const supabase = createClient();

export async function fetchGroupDetail(groupId: string): Promise<Tables<"conversations"> | null> {
  const { data } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", groupId)
    .eq("is_group", true)
    .maybeSingle();
  return data ?? null;
}

export async function fetchGroupRole(groupId: string, userId: string): Promise<string> {
  const { data } = await supabase
    .from("conversation_members")
    .select("role")
    .eq("convo_id", groupId)
    .eq("user_id", userId)
    .maybeSingle();
  return (data?.role as string) ?? "member";
}
