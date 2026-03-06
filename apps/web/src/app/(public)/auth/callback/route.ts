import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { env } from "env";
import { ROUTES } from "@/app/_libs/constants/routes";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type");

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

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      let redirectPath: string;

      if (type === "recovery") {
        redirectPath = ROUTES.AUTH.RESET_PASSWORD;
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        const isOnboarded = user?.user_metadata?.onboarded === true;
        redirectPath = isOnboarded ? ROUTES.APP.CHAT : ROUTES.APP.ONBOARDING;
      }

      const response = NextResponse.redirect(`${origin}${redirectPath}`);
      collectedCookies.forEach(({ name, value, options }) =>
        response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
      );
      return response;
    }
  }

  return NextResponse.redirect(`${origin}${ROUTES.AUTH.LOGIN}`);
}
