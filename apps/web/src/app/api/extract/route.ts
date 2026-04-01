import { NextRequest, NextResponse } from "next/server";

import {
  type ContentType,
  extractMetaContent,
  extractMetadataFull,
} from "@/app/_libs/metadata/extractor";
import { createClient } from "@/app/_libs/supabase/server";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function cleanSource(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function mapContentType(ct: ContentType): "article" | "video" | "podcast" {
  if (ct === "video") return "video";
  if (ct === "spotify") return "podcast";
  return "article"; // article, substack, tweet, link
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
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "Authentication required." },
        { status: 401 },
      );
    }

    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "INVALID_URL", message: "Please provide a valid URL." },
        { status: 400 },
      );
    }
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: "INVALID_URL", message: "Please provide a valid URL." },
        { status: 400 },
      );
    }

    // ── Extract metadata using the full extractor ──
    const meta = await extractMetadataFull(url);
    const contentType = mapContentType(meta.contentType);
    const source = cleanSource(url);

    // ── Compute supplementary fields from HTML when available ──
    let author: string | undefined;
    let readTime: string | undefined;
    let duration: string | undefined;

    if (meta.html) {
      author =
        extractMetaContent(meta.html, "og:author") ||
        extractMetaContent(meta.html, "article:author") ||
        undefined;

      if (contentType === "article") {
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

      if (contentType === "podcast") {
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

    return NextResponse.json({
      url,
      title: meta.title,
      source,
      author,
      previewImage: meta.thumbnail,
      contentType,
      readTime,
      duration,
      description: meta.description,
    });
  } catch {
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Something went wrong." },
      { status: 500 },
    );
  }
}
