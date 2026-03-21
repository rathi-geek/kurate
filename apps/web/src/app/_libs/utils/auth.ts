import type { User } from "@supabase/supabase-js";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

import { ROUTES } from "@/app/_libs/constants/routes";
import { createClient } from "@/app/_libs/supabase/client";

/**
 * Redirect a freshly-authenticated user to the correct destination.
 *
 * Priority:
 *   1. Admin role  → /admin/dashboard
 *   2. Onboarded   → /home
 *   3. New user    → /onboarding
 */
export async function redirectAfterAuth(user: User | null, router: AppRouterInstance) {
  if (user?.user_metadata?.role === "admin") {
    router.replace(ROUTES.ADMIN.DASHBOARD);
    return;
  }
  if (!user) {
    router.replace(ROUTES.APP.ONBOARDING);
    return;
  }
  const supabase = createClient();
  const { data } = await supabase
    .from("profiles")
    .select("is_onboarded")
    .eq("id", user.id)
    .single();
  router.replace(data?.is_onboarded ? ROUTES.APP.HOME : ROUTES.APP.ONBOARDING);
}
