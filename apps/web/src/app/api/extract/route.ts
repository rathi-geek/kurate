import { NextRequest, NextResponse } from "next/server";

import {
  extractMetaContent,
  extractMetadataFull,
} from "@/app/_libs/metadata/extractor";
import { createClient } from "@/app/_libs/supabase/server";

// ─── Extension CORS ───────────────────────────────────────────────────────────
// The extension calls this endpoint with a Bearer token (no cookie session).
// We need CORS headers + an OPTIONS preflight handler so Chrome allows the fetch.

function isAllowedExtensionOrigin(origin: string | null): boolean {
  if (!origin) return false;
  const extId = process.env.EXTENSION_ID;
  if (extId && origin === `chrome-extension://${extId}`) return true;
  if (process.env.NODE_ENV === "development" && origin.startsWith("chrome-extension://")) return true;
  return false;
}

function extensionCorsHeaders(origin: string) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!isAllowedExtensionOrigin(origin)) {
    return new NextResponse(null, { status: 403 });
  }
  return new NextResponse(null, { status: 204, headers: extensionCorsHeaders(origin!) });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function cleanSource(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function estimateReadTime(wordCount: number): string {
  const minutes = Math.ceil(wordCount / 250);
  return `${minutes} min read`;
}

function formatIsoDuration(iso: string): string | undefined {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return undefined;
  const h = parseInt(m[1] ?? "0");
  const min = parseInt(m[2] ?? "0");
  const totalMin = h * 60 + min;
  if (totalMin === 0) return undefined;
  return h > 0 ? `${h}h ${min}m watch` : `${totalMin} min watch`;
}

// ─── Route Handler ───────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  const isExtension = isAllowedExtensionOrigin(origin);
  const extraHeaders = isExtension ? extensionCorsHeaders(origin!) : {};

  try {
    // Support cookie auth (web), Bearer token auth (mobile + extension)
    const authHeader = req.headers.get("authorization");
    const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    let user;
    if (bearerToken) {
      // Mobile / Extension: use Bearer token to get user
      const { createClient: createServiceClient } = await import("@supabase/supabase-js");
      const supabaseWithToken = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { global: { headers: { Authorization: `Bearer ${bearerToken}` } } },
      );
      const { data } = await supabaseWithToken.auth.getUser(bearerToken);
      user = data.user;
    } else {
      // Web: use cookie-based auth
      const supabase = await createClient();
      const { data } = await supabase.auth.getUser();
      user = data.user;
    }

    if (!user) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "Authentication required." },
        { status: 401, headers: extraHeaders },
      );
    }

    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "INVALID_URL", message: "Please provide a valid URL." },
        { status: 400, headers: extraHeaders },
      );
    }
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: "INVALID_URL", message: "Please provide a valid URL." },
        { status: 400, headers: extraHeaders },
      );
    }

    const meta = await extractMetadataFull(url);
    const contentType = meta.contentType;
    const source = cleanSource(url);

    let author: string | undefined;
    let readTime: string | undefined;
    let duration: string | undefined;

    if (meta.html) {
      author =
        extractMetaContent(meta.html, "og:author") ||
        extractMetaContent(meta.html, "article:author") ||
        undefined;

      if (contentType === "article" || contentType === "substack") {
        const bodyText = meta.html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        const wordCount = bodyText.split(/\s+/).length;
        if (wordCount > 100) {
          readTime = estimateReadTime(wordCount);
        }
      }

      if (contentType === "video") {
        const dMatch = meta.html.match(/"duration"\s*:\s*"(PT[^"]+)"/);
        if (dMatch?.[1]) duration = formatIsoDuration(dMatch[1]);
      }

      if (contentType === "spotify") {
        const rawSecs = extractMetaContent(meta.html, "music:duration");
        if (rawSecs) {
          const secs = parseInt(rawSecs);
          if (!isNaN(secs) && secs > 0) {
            const min = Math.round(secs / 60);
            duration = min >= 60 ? `${Math.floor(min / 60)}h ${min % 60}m` : `${min} min`;
          }
        }
      }
    }

    return NextResponse.json(
      {
        url,
        title: meta.title,
        source,
        author,
        previewImage: meta.thumbnail,
        contentType,
        readTime,
        duration,
        description: meta.description,
      },
      { headers: extraHeaders },
    );
  } catch {
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Something went wrong." },
      { status: 500, headers: extraHeaders },
    );
  }
}
