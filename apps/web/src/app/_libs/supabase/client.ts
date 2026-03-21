import { createBrowserClient } from "@supabase/ssr";
import { env } from "env";

import type { Database } from "@/app/_libs/types/database.types";

export function createClient() {
  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
