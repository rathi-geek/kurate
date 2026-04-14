"use client";

import { useGroupInvites as _useGroupInvites } from "@kurate/hooks";
export type { GroupInvite } from "@kurate/hooks";

import { createClient } from "@/app/_libs/supabase/client";

const supabase = createClient();

export function useGroupInvites(groupId: string) {
  return _useGroupInvites(supabase, groupId);
}
