import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "env";

export async function proxy(request: NextRequest) {
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

export const config = {
  matcher: [
    "/chat/:path*",
    "/profile/:path*",
    "/shared/:path*",
    "/groups/:path*",
    "/dashboard/:path*",
    "/auth/:path*",
  ],
};
