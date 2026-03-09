import type { User } from "@supabase/supabase-js";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

import { ROUTES } from "@/app/_libs/constants/routes";

/**
 * Redirect a freshly-authenticated user to the correct destination.
 *
 * Priority:
 *   1. Admin role  → /admin/dashboard
 *   2. Onboarded   → /home
 *   3. New user    → /onboarding
 */
export function redirectAfterAuth(user: User | null, router: AppRouterInstance) {
  if (user?.user_metadata?.role === "admin") {
    router.replace(ROUTES.ADMIN.DASHBOARD);
    return;
  }
  const isOnboarded = user?.user_metadata?.onboarded === true;
  router.replace(isOnboarded ? ROUTES.APP.HOME : ROUTES.APP.ONBOARDING);
}
