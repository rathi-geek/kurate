"use client";

import { useGroupDetail as _useGroupDetail, useGroupRole as _useGroupRole } from "@kurate/hooks";

import { createClient } from "@/app/_libs/supabase/client";

const supabase = createClient();

export function useGroupDetail(groupId: string) {
  return _useGroupDetail(supabase, groupId);
}

export function useGroupRole(groupId: string, userId: string) {
  return _useGroupRole(supabase, groupId, userId);
}
