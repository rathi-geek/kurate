import { NextResponse } from "next/server";

import { createClient } from "@/app/_libs/supabase/server";

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  const extId = process.env.EXTENSION_ID;
  if (extId && origin === `chrome-extension://${extId}`) return true;
  if (process.env.NODE_ENV === "development") {
    if (origin.startsWith("chrome-extension://")) return true;
    if (origin === "http://localhost:3000") return true;
  }
  return false;
}

function corsHeaders(origin: string) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "cache-control": "no-store",
  };
}

// Preflight — required when fetch includes credentials or non-simple headers
export async function OPTIONS(request: Request) {
  const origin = request.headers.get("origin");
  if (!isAllowedOrigin(origin)) {
    return new NextResponse(null, { status: 403 });
  }
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin!) });
}

export async function GET(request: Request) {
  const origin = request.headers.get("origin");
  if (!isAllowedOrigin(origin)) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const headers = corsHeaders(origin!);
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getSession();
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 401, headers });
  }

  if (!data.session) {
    return NextResponse.json({ ok: true, session: null }, { headers });
  }

  const { access_token, refresh_token, expires_at, user } = data.session;
  return NextResponse.json(
    { ok: true, session: { access_token, refresh_token, expires_at, user } },
    { headers },
  );
}
