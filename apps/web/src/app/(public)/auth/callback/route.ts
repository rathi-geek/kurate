import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { env } from "env";
import { ROUTES } from "@/app/_libs/constants/routes";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type"); // "signup" | "recovery" etc.

  if (code) {
    const redirectTo =
      type === "recovery"
        ? `${origin}${ROUTES.AUTH.RESET_PASSWORD}`
        : `${origin}${ROUTES.APP.CHAT}`;

    const response = NextResponse.redirect(redirectTo);

    const supabase = createServerClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
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

  const { origin: o } = new URL(request.url);
  return NextResponse.redirect(`${o}${ROUTES.AUTH.LOGIN}`);
}
