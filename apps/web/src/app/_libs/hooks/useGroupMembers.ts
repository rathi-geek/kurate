"use client";

import { useGroupMembers as _useGroupMembers } from "@kurate/hooks";

import { createClient } from "@/app/_libs/supabase/client";

const supabase = createClient();

export function useGroupMembers(groupId: string, currentUserId: string) {
  return _useGroupMembers(supabase, groupId, currentUserId);
}
