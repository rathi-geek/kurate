import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { env } from "env";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type"); // "signup" | "recovery" etc.

  if (code) {
    const response = NextResponse.redirect(
      type === "recovery"
        ? `${origin}/auth/reset-password`
        : `${origin}/chat`
    );

    const supabase = createServerClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return (
              request.headers
                .get("cookie")
                ?.split("; ")
                .map((c) => {
                  const [name, ...rest] = c.split("=");
                  return { name: name ?? "", value: rest.join("=") };
                }) ?? []
            );
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return response;
    }
  }

  // If code exchange fails or no code, redirect to login
  const { origin: o } = new URL(request.url);
  return NextResponse.redirect(`${o}/auth/login`);
}
