import { fetchGroupDetail as _fetchGroupDetail, fetchGroupRole as _fetchGroupRole } from "@kurate/hooks";

import { createClient } from "@/app/_libs/supabase/client";

const supabase = createClient();

export async function fetchGroupDetail(groupId: string) {
  return _fetchGroupDetail(supabase, groupId);
}

export async function fetchGroupRole(groupId: string, userId: string) {
  return _fetchGroupRole(supabase, groupId, userId);
}
