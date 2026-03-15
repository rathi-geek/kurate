import { createServerClient } from "@supabase/ssr";
import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "env";
import { ROUTES } from "@/app/_libs/constants/routes";
import { routing } from "@/i18n/config";

const intlMiddleware = createMiddleware(routing);

/** Single request handler: locale (next-intl) first, then Supabase auth. Next.js 16+ uses proxy.ts (not middleware.ts). */
export async function proxy(request: NextRequest) {
  // Run next-intl first for locale detection / redirect
  const intlResponse = intlMiddleware(request);
  if (intlResponse.status !== 200) return intlResponse;

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh the session — critical for server components and avoiding session errors on /
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes: redirect to login if not authenticated
  // DEV BYPASS: skip auth redirect for local development when BYPASS_AUTH=true
  const bypassAuth =
    env.NODE_ENV === "development" && env.BYPASS_AUTH === "true";

  const pathname = request.nextUrl.pathname;

  const isAdminRoute = pathname.startsWith(ROUTES.ADMIN.BASE);
  const isAdmin = user?.user_metadata?.role === "admin";

  // App routes (require auth + completed onboarding)
  const isAppRoute =
    pathname.startsWith(ROUTES.APP.HOME) ||
    pathname.startsWith(ROUTES.APP.PROFILE) ||
    pathname.startsWith(ROUTES.APP.SHARED) ||
    pathname.startsWith(ROUTES.APP.GROUPS) ||
    pathname.startsWith(ROUTES.APP.DASHBOARD);

  // All protected routes (require auth)
  const isProtectedRoute =
    isAppRoute ||
    pathname.startsWith(ROUTES.APP.ONBOARDING) ||
    isAdminRoute;

  // Not logged in → login
  if (!bypassAuth && !user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = ROUTES.AUTH.LOGIN;
    return NextResponse.redirect(url);
  }

  // Admin routes: only admins may access
  if (!bypassAuth && user && isAdminRoute && !isAdmin) {
    const url = request.nextUrl.clone();
    url.pathname = ROUTES.ERROR.FORBIDDEN;
    return NextResponse.redirect(url);
  }

  // Logged in but not yet onboarded → onboarding (only from app routes; admins bypass)
  if (user && isAppRoute && !isAdmin) {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("is_onboarded")
      .eq("id", user.id)
      .single();

    if (!profileData?.is_onboarded) {
      const url = request.nextUrl.clone();
      url.pathname = ROUTES.APP.ONBOARDING;
      return NextResponse.redirect(url);
    }
  }

  // Auth pages: redirect logged-in users to the right destination
  // Landing page (/) is intentionally NOT in this list — authenticated users can still visit it
  const isAuthRoute =
    pathname.startsWith(ROUTES.AUTH.BASE) &&
    pathname !== ROUTES.AUTH.CALLBACK;

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    if (isAdmin) {
      url.pathname = ROUTES.ADMIN.DASHBOARD;
    } else {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("is_onboarded")
        .eq("id", user.id)
        .single();
      url.pathname = profileData?.is_onboarded ? ROUTES.APP.HOME : ROUTES.APP.ONBOARDING;
    }
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export default proxy;

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
