import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/app/_libs/supabase/server";
import { extractTagsFromHtml } from "@kurate/utils";

const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

function getYouTubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtube.com") && parsed.searchParams.has("v")) {
      return parsed.searchParams.get("v");
    }
    if (parsed.hostname === "youtu.be" || parsed.hostname === "www.youtu.be") {
      return parsed.pathname.slice(1).split("/")[0] || null;
    }
  } catch {}
  return null;
}

function isXUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host === "x.com" || host === "twitter.com" || host === "www.x.com" || host === "www.twitter.com";
  } catch {
    return false;
  }
}

function titleFromUrl(url: string): string {
  const parsed = new URL(url);
  const hostname = parsed.hostname.replace(/^www\./, "");
  const segments = parsed.pathname.split("/").filter(Boolean);
  const skip = new Set(["index", "p", "post", "posts", "blog", "article", "articles", "a", "s"]);
  const slug = [...segments].reverse().find((s) => !skip.has(s) && s.length > 2);

  if (slug) {
    return slug
      .replace(/[-_]/g, " ")
      .replace(/\.[^.]+$/, "")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return hostname;
}

function fallbackMeta(url: string) {
  const hostname = new URL(url).hostname.replace(/^www\./, "");
  return {
    url,
    title: titleFromUrl(url),
    source: hostname,
    contentType: "article" as const,
    tags: [] as string[],
  };
}

function detectContentType(url: string): "video" | "podcast" | "article" {
  const host = new URL(url).hostname.toLowerCase();
  if (host.includes("youtube.com") || host.includes("youtu.be") || host.includes("vimeo.com")) {
    return "video";
  }
  if (host.includes("spotify.com") || host.includes("podcasts.apple.com")) {
    return "podcast";
  }
  return "article";
}

function cleanSource(url: string): string {
  try {
    const host = new URL(url).hostname;
    return host.replace(/^www\./, "");
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

function getMeta(html: string, property: string): string | undefined {
  const esc = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${esc}["'][^>]+content=["']([^"'<>]+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"'<>]+["'])[^>]+(?:property|name)=["']${esc}["']`, "i"),
  ];
  for (const p of patterns) {
    const match = html.match(p);
    if (match?.[1]) {
      return match[1].trim();
    }
  }
  return undefined;
}

function parseMetadata(html: string, url: string) {
  const title = getMeta(html, "og:title") || getMeta(html, "twitter:title") || cleanSource(url);
  const author = getMeta(html, "og:author") || getMeta(html, "article:author");
  const rawImage = getMeta(html, "og:image") || getMeta(html, "twitter:image");
  let previewImage: string | undefined;
  if (rawImage) {
    try {
      previewImage = new URL(rawImage, url).href;
    } catch {
      previewImage = rawImage;
    }
  }
  const description = getMeta(html, "og:description") || getMeta(html, "twitter:description");
  const contentType = detectContentType(url);
  let readTime: string | undefined;
  let duration: string | undefined;
  if (contentType === "article") {
    const bodyText = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "").replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const wordCount = bodyText.split(/\s+/).length;
    if (wordCount > 100) {
      readTime = estimateReadTime(wordCount);
    }
  } else if (contentType === "podcast") {
    const rawSecs = getMeta(html, "music:duration");
    if (rawSecs) {
      const secs = parseInt(rawSecs);
      if (!isNaN(secs) && secs > 0) {
        const min = Math.round(secs / 60);
        duration = min >= 60 ? `${Math.floor(min / 60)}h ${min % 60}m` : `${min} min`;
      }
    }
  }
  const tags = extractTagsFromHtml(html);
  return { url, title, source: cleanSource(url), author, previewImage, contentType, readTime, duration, description, tags };
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "UNAUTHORIZED", message: "Authentication required." }, { status: 401 });
    }

    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "INVALID_URL", message: "Please provide a valid URL." }, { status: 400 });
    }
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: "INVALID_URL", message: "Please provide a valid URL." }, { status: 400 });
    }

    const ytVideoId = getYouTubeVideoId(url);
    if (ytVideoId) {
      let ytTitle = "YouTube Video";
      let ytAuthor: string | undefined;
      let ytThumbnail = `https://img.youtube.com/vi/${ytVideoId}/hqdefault.jpg`;
      try {
        const oembedRes = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`, {
          headers: { "User-Agent": BROWSER_UA },
        });
        if (oembedRes.ok) {
          const oembed = await oembedRes.json();
          if (oembed.title) ytTitle = oembed.title;
          if (oembed.author_name) ytAuthor = oembed.author_name;
          if (oembed.thumbnail_url) ytThumbnail = oembed.thumbnail_url;
        }
      } catch {}
      let ytDuration: string | undefined;
      let ytTags: string[] = [];
      try {
        const pageRes = await fetch(`https://www.youtube.com/watch?v=${ytVideoId}`, {
          headers: { "User-Agent": BROWSER_UA },
        });
        if (pageRes.ok) {
          const pageHtml = await pageRes.text();
          // Duration lives in the ytInitialPlayerResponse JSON
          const dMatch = pageHtml.match(/"duration"\s*:\s*"(PT[^"]+)"/);
          if (dMatch?.[1]) ytDuration = formatIsoDuration(dMatch[1]);
          // Tags live in ytInitialData as "keywords":[...]
          const kwMatch = pageHtml.match(/"keywords"\s*:\s*(\[[^\]]*?\])/s);
          if (kwMatch?.[1]) {
            try {
              const parsed: unknown = JSON.parse(kwMatch[1]);
              if (Array.isArray(parsed)) {
                ytTags = (parsed as unknown[])
                  .filter((k): k is string => typeof k === "string" && k.length > 0 && k.length < 50)
                  .slice(0, 6);
              }
            } catch {}
          }
        }
      } catch {}
      return NextResponse.json({ url, title: ytTitle, source: "youtube.com", author: ytAuthor, contentType: "video" as const, previewImage: ytThumbnail, duration: ytDuration, tags: ytTags });
    }

    if (isXUrl(url) || url.includes("t.co/")) {
      return NextResponse.json({ url, title: "Tweet", source: "x.com", contentType: "article" as const, tags: [] as string[] });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    let html: string;
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { "User-Agent": BROWSER_UA, Accept: "text/html,application/xhtml+xml" },
        redirect: "follow",
      });
      clearTimeout(timeout);
      if (!res.ok) return NextResponse.json(fallbackMeta(url));
      html = await res.text();
    } catch {
      clearTimeout(timeout);
      return NextResponse.json(fallbackMeta(url));
    }

    const meta = parseMetadata(html, url);
    return NextResponse.json(meta);
  } catch {
    return NextResponse.json({ error: "INTERNAL_ERROR", message: "Something went wrong." }, { status: 500 });
  }
}
