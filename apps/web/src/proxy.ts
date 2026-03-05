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
  const isProtectedRoute =
    pathname.startsWith(ROUTES.APP.CHAT) ||
    pathname.startsWith(ROUTES.APP.PROFILE) ||
    pathname.startsWith(ROUTES.APP.SHARED) ||
    pathname.startsWith(ROUTES.APP.GROUPS) ||
    pathname.startsWith(ROUTES.APP.DASHBOARD);

  if (!bypassAuth && !user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = ROUTES.AUTH.LOGIN;
    return NextResponse.redirect(url);
  }

  // Public-only routes: redirect to chat if already authenticated
  // Covers landing page and all auth pages except callback + reset-password
  const isPublicOnlyRoute =
    pathname === ROUTES.HOME ||
    (pathname.startsWith(ROUTES.AUTH.BASE) &&
      pathname !== ROUTES.AUTH.CALLBACK &&
      pathname !== ROUTES.AUTH.RESET_PASSWORD);

  if (user && isPublicOnlyRoute) {
    const url = request.nextUrl.clone();
    url.pathname = ROUTES.APP.CHAT;
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
