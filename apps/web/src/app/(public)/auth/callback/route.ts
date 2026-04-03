import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { env } from "env";
import { ROUTES } from "@kurate/utils";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const collectedCookies: Array<{ name: string; value: string; options: object }> = [];

    const supabase = createServerClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach((c) => collectedCookies.push(c));
          },
        },
      }
    );

    const next = searchParams.get("next");
    const safeNext = next && next.startsWith("/") ? next : null;

    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("[auth/callback] exchangeCodeForSession failed:", error.message);
      return NextResponse.redirect(
        `${origin}${ROUTES.AUTH.LOGIN}?error=auth_callback_failed`
      );
    }

    const user = sessionData.session?.user;
    let redirectPath: string;

    if (user?.user_metadata?.role === "admin") {
      redirectPath = ROUTES.ADMIN.DASHBOARD;
    } else if (user?.user_metadata?.is_onboarded === true) {
      // Already synced to JWT — skip DB query
      redirectPath = safeNext ?? ROUTES.APP.HOME;
    } else {
      // Legacy or new user: check DB once, then sync to JWT
      const { data: profileData } = await supabase
        .from("profiles")
        .select("is_onboarded")
        .eq("id", user!.id)
        .single();

      if (profileData?.is_onboarded) {
        await supabase.auth.updateUser({ data: { is_onboarded: true } }).catch(() => {});
        redirectPath = safeNext ?? ROUTES.APP.HOME;
      } else {
        redirectPath = safeNext
          ? `${ROUTES.APP.ONBOARDING}?next=${encodeURIComponent(safeNext)}`
          : ROUTES.APP.ONBOARDING;
      }
    }

    const response = NextResponse.redirect(`${origin}${redirectPath}`);
    collectedCookies.forEach(({ name, value, options }) =>
      response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
    );
    return response;
  }

  return NextResponse.redirect(`${origin}${ROUTES.AUTH.LOGIN}`);
}
