import { createServerClient } from "@supabase/ssr";
import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "env";
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
    pathname.startsWith("/chat") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/shared") ||
    pathname.startsWith("/groups") ||
    pathname.startsWith("/dashboard");

  if (!bypassAuth && !user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  // Auth routes: redirect to chat if already authenticated
  // Exception: /auth/callback (needs to process) and /auth/reset-password (needs session to update password)
  if (
    user &&
    pathname.startsWith("/auth") &&
    pathname !== "/auth/callback" &&
    pathname !== "/auth/reset-password"
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/chat";
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
