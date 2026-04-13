import { fetchUserGroups as _fetchUserGroups } from "@kurate/hooks";
import { env } from "env";

import { createClient } from "@/app/_libs/supabase/client";

export type { GroupRow } from "@kurate/hooks";

const supabase = createClient();

export async function fetchUserGroups() {
  return _fetchUserGroups(supabase, env.NEXT_PUBLIC_SUPABASE_URL);
}
