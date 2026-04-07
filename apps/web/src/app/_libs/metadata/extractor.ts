/**
 * URL Metadata Extractor (adapted from standalone metadata-extractor.ts)
 *
 * Extracts title, description, thumbnail, and content type from any URL.
 * Handles sites behind Cloudflare, DataDome, and paywalls with dedicated
 * handlers for 20+ major publications.
 *
 * Returns raw HTML when available so the API route can compute supplementary
 * fields (readTime, duration, author).
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type ContentType = "video" | "article" | "substack" | "tweet" | "link" | "spotify";

export interface MetadataFull {
  title: string;
  description: string | null;
  thumbnail: string | null;
  contentType: ContentType;
  html: string | null; // null for oEmbed/RSS handlers; actual HTML for generic path
}

// ─── Main Entry Point ────────────────────────────────────────────────────────

export async function extractMetadataFull(url: string): Promise<MetadataFull> {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.toLowerCase();

    // ── Dedicated handlers for sites that block standard scraping ──

    if (hostname.includes("twitter.com") || hostname.includes("x.com")) {
      return await handleTwitterUrl(url);
    }

    if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) {
      return await handleYouTubeUrl(url);
    }

    if (hostname.includes("open.spotify.com")) {
      const pathname = parsedUrl.pathname;
      if (pathname.startsWith("/episode/") || pathname.startsWith("/show/")) {
        return await handleSpotifyUrl(url);
      }
    }

    if (hostname.includes("nytimes.com")) {
      return await handleNYTimesUrl(url);
    }

    if (hostname.includes("wsj.com")) {
      return await handleWSJUrl(url);
    }

    if (hostname.includes("ft.com")) {
      return await handleFTUrl(url);
    }

    if (hostname.includes("bloomberg.com")) {
      return await handleBloombergUrl(url);
    }

    if (hostname.includes("reuters.com")) {
      return await handleReutersUrl(url);
    }

    // ── Generic path: fetch with Chrome UA, fallback to Slackbot ──

    const response = await fetch(url, {
      headers: {
        "User-Agent": CHROME_UA,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      signal: AbortSignal.timeout(8000),
    });

    let html = response.ok ? await response.text() : "";

    // Retry with Slackbot UA if blocked by Cloudflare/bot protection
    if (!response.ok || isCloudflareChallenge(html)) {
      const botResponse = await fetch(url, {
        headers: {
          "User-Agent": SLACKBOT_UA,
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        redirect: "follow",
        signal: AbortSignal.timeout(8000),
      });
      if (botResponse.ok) {
        const botHtml = await botResponse.text();
        if (!isCloudflareChallenge(botHtml)) {
          html = botHtml;
        }
      }
    }

    if (!html) {
      return {
        title: url,
        description: null,
        thumbnail: null,
        contentType: detectContentType(url),
        html: null,
      };
    }

    const baseOrigin = parsedUrl.origin;

    // Extract thumbnail with multi-level fallback
    let thumbnail =
      extractMetaContent(html, "og:image") || extractMetaContent(html, "twitter:image");

    if (!thumbnail) {
      const iconPath = extractAppleTouchIcon(html) || extractFavicon(html);
      if (iconPath) {
        thumbnail = iconPath.startsWith("http")
          ? iconPath
          : new URL(iconPath, baseOrigin).toString();
      } else {
        for (const path of FAVICON_FALLBACK_PATHS) {
          const testUrl = `${baseOrigin}${path}`;
          try {
            const testResponse = await fetch(testUrl, { method: "HEAD" });
            if (testResponse.ok) {
              thumbnail = testUrl;
              break;
            }
          } catch {
            /* continue */
          }
        }
      }
    } else if (!thumbnail.startsWith("http")) {
      thumbnail = new URL(thumbnail, baseOrigin).toString();
    }

    thumbnail = proxyImageIfNeeded(thumbnail);

    return {
      title:
        extractMetaContent(html, "og:title") ||
        extractMetaContent(html, "twitter:title") ||
        extractTitle(html) ||
        url,
      description:
        extractMetaContent(html, "og:description") ||
        extractMetaContent(html, "twitter:description") ||
        extractMetaContent(html, "description"),
      thumbnail,
      contentType: detectContentTypeFromHtml(html, url),
      html,
    };
  } catch {
    return {
      title: url,
      description: null,
      thumbnail: null,
      contentType: detectContentType(url),
      html: null,
    };
  }
}

// ─── Constants ───────────────────────────────────────────────────────────────

const CHROME_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const SLACKBOT_UA = "Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)";

const FAVICON_FALLBACK_PATHS = [
  "/apple-touch-icon.png",
  "/apple-touch-icon-precomposed.png",
  "/favicon-192x192.png",
  "/favicon-32x32.png",
  "/favicon.ico",
];

// Domains that block direct browser access to images — proxied through wsrv.nl
const PROTECTED_IMAGE_DOMAINS = ["economist.com", "politico.com", "wsj.net", "s.wsj.net"];

const WSJ_RSS_FEEDS = [
  "WSJcomUSBusiness",
  "RSSMarketsMain",
  "WSJ_World_News",
  "WSJ_Lifestyle",
  "RSSOpinion",
  "RSSLifestyle",
];

// ─── Detection Helpers ───────────────────────────────────────────────────────

function isCloudflareChallenge(html: string): boolean {
  return (
    html.includes("cf_chl") ||
    (html.includes("Just a moment") && html.includes("challenge-platform"))
  );
}

export function detectContentType(url: string): ContentType {
  const hostname = new URL(url).hostname.toLowerCase();
  if (
    ["youtube.com", "youtu.be", "vimeo.com", "twitch.tv", "dailymotion.com"].some((d) =>
      hostname.includes(d),
    )
  )
    return "video";
  if (hostname.includes("substack.com")) return "substack";
  if (
    hostname.includes("twitter.com") ||
    hostname.includes("x.com") ||
    hostname.includes("threads.net")
  )
    return "tweet";
  if (hostname.includes("open.spotify.com")) {
    const pathname = new URL(url).pathname;
    if (pathname.startsWith("/episode/") || pathname.startsWith("/show/")) return "spotify";
  }
  if (
    [
      "medium.com",
      "dev.to",
      "hashnode.com",
      "hackernoon.com",
      "freecodecamp.org",
      "news.ycombinator.com",
    ].some((d) => hostname.includes(d)) ||
    hostname.includes("blog.")
  )
    return "article";
  return "link";
}

function detectContentTypeFromHtml(html: string, url: string): ContentType {
  const hostname = new URL(url).hostname.toLowerCase();
  const pathname = new URL(url).pathname.toLowerCase();
  if (
    ["youtube.com", "youtu.be", "vimeo.com", "twitch.tv", "dailymotion.com"].some((d) =>
      hostname.includes(d),
    )
  )
    return "video";
  if (hostname.includes("substack.com")) return "substack";
  if (
    hostname.includes("twitter.com") ||
    hostname.includes("x.com") ||
    hostname.includes("threads.net")
  )
    return "tweet";
  if (
    hostname.includes("open.spotify.com") &&
    (pathname.startsWith("/episode/") || pathname.startsWith("/show/"))
  )
    return "spotify";
  if (extractMetaContent(html, "og:type")?.toLowerCase() === "article") return "article";
  if (
    extractMetaContent(html, "article:published_time") ||
    extractMetaContent(html, "article:author")
  )
    return "article";
  if (/<article[\s>]/i.test(html)) return "article";
  if (/\/(blog|article|post|posts|news|p)\//.test(pathname)) return "article";
  if (
    [
      "medium.com",
      "dev.to",
      "hashnode.com",
      "hackernoon.com",
      "freecodecamp.org",
      "news.ycombinator.com",
    ].some((d) => hostname.includes(d)) ||
    hostname.includes("blog.")
  )
    return "article";
  return "link";
}

// ─── Image Proxy ─────────────────────────────────────────────────────────────

function isProtectedImage(imageUrl: string): boolean {
  try {
    const hostname = new URL(imageUrl).hostname.toLowerCase();
    return PROTECTED_IMAGE_DOMAINS.some((domain) => hostname.includes(domain));
  } catch {
    return false;
  }
}

function proxyImageIfNeeded(imageUrl: string | null): string | null {
  if (!imageUrl) return null;
  if (isProtectedImage(imageUrl)) {
    return `https://wsrv.nl/?url=${encodeURIComponent(imageUrl)}&w=640&q=80`;
  }
  return imageUrl;
}

// ─── HTML Parsing Helpers ────────────────────────────────────────────────────

export function extractMetaContent(html: string, property: string): string | null {
  // property="X" content="Y"
  const m1 = html.match(
    new RegExp(`<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']*)["']`, "i"),
  );
  if (m1) return m1[1];
  // content="Y" property="X"
  const m2 = html.match(
    new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*property=["']${property}["']`, "i"),
  );
  if (m2) return m2[1];
  // name="X" content="Y"
  const m3 = html.match(
    new RegExp(`<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']*)["']`, "i"),
  );
  if (m3) return m3[1];
  // content="Y" name="X"
  const m4 = html.match(
    new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*name=["']${property}["']`, "i"),
  );
  if (m4) return m4[1];
  return null;
}

function extractTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return match ? match[1].trim() : null;
}

function extractAppleTouchIcon(html: string): string | null {
  const sizeMatches = html.match(
    /<link[^>]*rel=["']apple-touch-icon[^"']*["'][^>]*sizes=["'](\d+)x\d+["'][^>]*href=["']([^"']+)["']/gi,
  );
  if (sizeMatches) {
    let largestSize = 0,
      largestHref: string | null = null;
    for (const m of sizeMatches) {
      const size = parseInt(m.match(/sizes=["'](\d+)x/i)?.[1] || "0");
      const href = m.match(/href=["']([^"']+)["']/i)?.[1];
      if (size > largestSize && href) {
        largestSize = size;
        largestHref = href;
      }
    }
    if (largestHref) return largestHref;
  }
  const fallback =
    html.match(/<link[^>]*rel=["']apple-touch-icon[^"']*["'][^>]*href=["']([^"']+)["']/i) ||
    html.match(/<link[^>]*href=["']([^"']+)["'][^>]*rel=["']apple-touch-icon[^"']*["']/i);
  return fallback ? fallback[1] : null;
}

function extractFavicon(html: string): string | null {
  const patterns = [
    /<link[^>]*rel=["']icon["'][^>]*sizes=["']192x192["'][^>]*href=["']([^"']+)["']/i,
    /<link[^>]*rel=["']icon["'][^>]*sizes=["']128x128["'][^>]*href=["']([^"']+)["']/i,
    /<link[^>]*rel=["']icon["'][^>]*sizes=["']96x96["'][^>]*href=["']([^"']+)["']/i,
    /<link[^>]*rel=["']icon["'][^>]*sizes=["']32x32["'][^>]*href=["']([^"']+)["']/i,
    /<link[^>]*rel=["']icon["'][^>]*type=["']image\/png["'][^>]*href=["']([^"']+)["']/i,
    /<link[^>]*rel=["']icon["'][^>]*href=["']([^"']+)["']/i,
    /<link[^>]*href=["']([^"']+)["'][^>]*rel=["']icon["']/i,
    /<link[^>]*rel=["']shortcut icon["'][^>]*href=["']([^"']+)["']/i,
    /<link[^>]*href=["']([^"']+)["'][^>]*rel=["']shortcut icon["']/i,
  ];
  for (const p of patterns) {
    const m = html.match(p);
    if (m) return m[1];
  }
  return null;
}

// ─── XML/RSS Helpers ─────────────────────────────────────────────────────────

function decodeXmlEntities(text: string): string {
  return text
    .replace(/&#x([0-9A-Fa-f]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function extractCdata(text: string): string {
  return text.match(/<!\[CDATA\[([\s\S]*?)\]\]>/)?.[1] ?? text;
}

function extractTitleFromUrl(url: string, fallback: string): string {
  try {
    const segments = new URL(url).pathname.split("/").filter(Boolean);
    const seg = segments.reverse().find((s) => s.length > 8 && !/^[a-f0-9-]+$/.test(s));
    if (seg) return seg.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  } catch {
    /* ignore */
  }
  return fallback;
}

// ─── Dedicated Handlers ──────────────────────────────────────────────────────

// Derives the token expected by Twitter's syndication API from the tweet ID.
// Formula reverse-engineered from the embedded tweet JS bundle.
function twitterSyndicationToken(tweetId: string): string {
  const id = BigInt(tweetId);
  const scaled = Number(id / BigInt("1000000000000000")); // id / 1e15
  return Math.floor(scaled * Math.PI).toString(36);
}

// Extracts the tweet text from the oEmbed HTML response.
// The HTML contains a <blockquote> with <p> tags holding the tweet text.
function extractTweetTextFromOEmbed(html: string): string | null {
  // Match all <p> content inside the <blockquote>
  const blockquote = html.match(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/i)?.[1];
  if (!blockquote) return null;
  const paragraphs = [...blockquote.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)];
  if (paragraphs.length === 0) return null;
  return paragraphs
    .map(([, content]) =>
      content
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<a[^>]*>([\s\S]*?)<\/a>/gi, "$1")
        .replace(/<[^>]+>/g, "")
        .trim(),
    )
    .filter(Boolean)
    .join("\n");
}

// Twitter/X: oEmbed API first, syndication API second, WhatsApp UA last
async function handleTwitterUrl(url: string): Promise<MetadataFull> {
  try {
    let expandedUrl = url;
    if (url.includes("t.co/")) {
      try {
        expandedUrl = (await fetch(url, { method: "HEAD", redirect: "follow" })).url;
      } catch {
        /* keep original */
      }
    }

    // ── Tier 1: Official oEmbed API ──
    try {
      const oembedResp = await fetch(
        `https://publish.x.com/oembed?url=${encodeURIComponent(expandedUrl)}&omit_script=true&dnt=true`,
        { signal: AbortSignal.timeout(6000) },
      );
      if (oembedResp.ok) {
        const oembed = await oembedResp.json();
        const tweetText = extractTweetTextFromOEmbed(oembed.html ?? "");
        const authorName = oembed.author_name ?? null;
        if (authorName || tweetText) {
          // Fetch thumbnail separately via WhatsApp UA (oEmbed doesn't return images)
          let thumbnail: string | null = null;
          try {
            const imgResp = await fetch(expandedUrl, {
              headers: {
                "User-Agent": "WhatsApp/2.23.20.0",
                Accept: "text/html",
              },
              redirect: "follow",
              signal: AbortSignal.timeout(5000),
            });
            if (imgResp.ok) {
              const imgHtml = await imgResp.text();
              thumbnail = extractMetaContent(imgHtml, "og:image");
            }
          } catch {
            /* thumbnail is best-effort */
          }

          return {
            title: authorName ? `${authorName} on X` : "Tweet",
            description: tweetText,
            thumbnail,
            contentType: "tweet",
            html: null,
          };
        }
      }
    } catch {
      /* fall to tier 2 */
    }

    // ── Tier 2: Syndication API ──
    const tweetId = expandedUrl.match(/status\/(\d+)/)?.[1];
    if (tweetId) {
      try {
        const resp = await fetch(
          `https://cdn.syndication.twimg.com/tweet-result?id=${tweetId}&token=${twitterSyndicationToken(tweetId)}`,
          { signal: AbortSignal.timeout(6000) },
        );
        if (resp.ok) {
          const data = await resp.json();
          const thumbnail =
            data.mediaDetails?.[0]?.media_url_https ||
            data.photos?.[0]?.url ||
            data.user?.profile_image_url_https?.replace("_normal", "_400x400") ||
            null;
          return {
            title: data.user?.name ? `${data.user.name} on X` : "Tweet",
            description: data.text || null,
            thumbnail,
            contentType: "tweet",
            html: null,
          };
        }
      } catch {
        /* fall to tier 3 */
      }
    }

    // ── Tier 3: WhatsApp UA for og:tags ──
    try {
      const response = await fetch(expandedUrl, {
        headers: {
          "User-Agent": "WhatsApp/2.23.20.0",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        redirect: "follow",
        signal: AbortSignal.timeout(6000),
      });
      if (response.ok) {
        const html = await response.text();
        const ogTitle = extractMetaContent(html, "og:title");
        const ogImage = extractMetaContent(html, "og:image");
        if (ogTitle || ogImage) {
          return {
            title: ogTitle || "Tweet",
            description: extractMetaContent(html, "og:description"),
            thumbnail: ogImage,
            contentType: "tweet",
            html: null,
          };
        }
      }
    } catch {
      /* fall through */
    }
  } catch {
    /* fall through */
  }
  return { title: "Tweet", description: null, thumbnail: null, contentType: "tweet", html: null };
}

// YouTube: oEmbed + predictable thumbnail URL + watch page for duration
async function handleYouTubeUrl(url: string): Promise<MetadataFull> {
  try {
    const parsedUrl = new URL(url);
    const videoId = parsedUrl.hostname.includes("youtu.be")
      ? parsedUrl.pathname.slice(1)
      : parsedUrl.searchParams.get("v");
    if (videoId) {
      const thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      let title = "YouTube Video";
      let description: string | null = null;

      const resp = await fetch(
        `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
      );
      if (resp.ok) {
        const data = await resp.json();
        title = data.title || title;
        description = data.author_name ? `by ${data.author_name}` : null;
      }

      // Fetch watch page for duration extraction
      let html: string | null = null;
      try {
        const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
          headers: { "User-Agent": CHROME_UA },
        });
        if (pageRes.ok) {
          html = await pageRes.text();
        }
      } catch {
        /* duration extraction is best-effort */
      }

      return { title, description, thumbnail, contentType: "video", html };
    }
  } catch {
    /* fall through */
  }
  return {
    title: "YouTube Video",
    description: null,
    thumbnail: null,
    contentType: "video",
    html: null,
  };
}

// Spotify: oEmbed + page fallback
async function handleSpotifyUrl(url: string): Promise<MetadataFull> {
  try {
    const resp = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`);
    if (resp.ok) {
      const data = await resp.json();
      return {
        title: data.title || "Spotify Podcast",
        description: data.provider_name ? `on ${data.provider_name}` : null,
        thumbnail: data.thumbnail_url || null,
        contentType: "spotify",
        html: null,
      };
    }
  } catch {
    /* fall through */
  }

  // Fallback: fetch page directly
  try {
    const resp = await fetch(url, {
      headers: { "User-Agent": CHROME_UA, Accept: "text/html" },
    });
    if (resp.ok) {
      const html = await resp.text();
      return {
        title: extractMetaContent(html, "og:title") || "Spotify Podcast",
        description: extractMetaContent(html, "og:description"),
        thumbnail: extractMetaContent(html, "og:image"),
        contentType: "spotify",
        html,
      };
    }
  } catch {
    /* fall through */
  }

  return {
    title: "Spotify Podcast",
    description: null,
    thumbnail: null,
    contentType: "spotify",
    html: null,
  };
}

// NY Times: oEmbed API (bypasses DataDome)
async function handleNYTimesUrl(url: string): Promise<MetadataFull> {
  try {
    const resp = await fetch(
      `https://www.nytimes.com/svc/oembed/json/?url=${encodeURIComponent(url)}`,
    );
    if (resp.ok) {
      const data = await resp.json();
      return {
        title: data.title || "The New York Times",
        description: data.summary || (data.author_name ? `by ${data.author_name}` : null),
        thumbnail: data.thumbnail_url || null,
        contentType: "article",
        html: null,
      };
    }
  } catch {
    /* fall through */
  }
  return {
    title: "The New York Times",
    description: null,
    thumbnail: null,
    contentType: "article",
    html: null,
  };
}

// WSJ: Dow Jones RSS feed matching by article slug (8-char hex ID)
async function handleWSJUrl(url: string): Promise<MetadataFull> {
  try {
    const slug = url.match(/([a-f0-9]{8})(?:\?|$)/)?.[1];
    if (slug) {
      const feeds = await Promise.all(
        WSJ_RSS_FEEDS.map(async (feed) => {
          try {
            const r = await fetch(`https://feeds.content.dowjones.io/public/rss/${feed}`, {
              signal: AbortSignal.timeout(5000),
            });
            return r.ok ? await r.text() : null;
          } catch {
            return null;
          }
        }),
      );
      for (const xml of feeds) {
        if (!xml) continue;
        const items = xml.matchAll(/<item>([\s\S]*?)<\/item>/g);
        for (const [, item] of items) {
          if (item.includes(slug)) {
            const title = item.match(/<title>([^<]*)<\/title>/)?.[1];
            const desc = item.match(/<description>([^<]*)<\/description>/)?.[1];
            const img = item.match(/<media:content[^>]*url="([^"]*)"/)?.[1];
            return {
              title: title ? decodeXmlEntities(title) : "The Wall Street Journal",
              description: desc ? decodeXmlEntities(desc) : null,
              thumbnail: proxyImageIfNeeded(img || null),
              contentType: "article",
              html: null,
            };
          }
        }
      }
    }
    return {
      title: extractTitleFromUrl(url, "The Wall Street Journal"),
      description: null,
      thumbnail: proxyImageIfNeeded("https://s.wsj.net/img/meta/wsj-social-share.png"),
      contentType: "article",
      html: null,
    };
  } catch {
    /* fall through */
  }
  return {
    title: "The Wall Street Journal",
    description: null,
    thumbnail: null,
    contentType: "article",
    html: null,
  };
}

// Financial Times: RSS feed matching by UUID
async function handleFTUrl(url: string): Promise<MetadataFull> {
  try {
    const uuid = url.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/)?.[1];
    if (uuid) {
      const feedUrls = [
        "https://www.ft.com/rss/home",
        "https://www.ft.com/world?format=rss",
        "https://www.ft.com/companies?format=rss",
        "https://www.ft.com/markets?format=rss",
        "https://www.ft.com/opinion?format=rss",
      ];
      const feeds = await Promise.all(
        feedUrls.map(async (u) => {
          try {
            const r = await fetch(u, { signal: AbortSignal.timeout(5000) });
            return r.ok ? await r.text() : null;
          } catch {
            return null;
          }
        }),
      );
      for (const xml of feeds) {
        if (!xml) continue;
        for (const [, item] of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
          if (item.includes(uuid)) {
            const title = item.match(/<title>([\s\S]*?)<\/title>/)?.[1];
            const desc = item.match(/<description>([\s\S]*?)<\/description>/)?.[1];
            const img = item.match(/<media:thumbnail[^>]*url="([^"]*)"/)?.[1];
            return {
              title: title ? decodeXmlEntities(extractCdata(title)) : "Financial Times",
              description: desc ? decodeXmlEntities(extractCdata(desc)) : null,
              thumbnail: img ? decodeXmlEntities(img) : null,
              contentType: "article",
              html: null,
            };
          }
        }
      }
    }
    return {
      title: extractTitleFromUrl(url, "Financial Times"),
      description: null,
      thumbnail: null,
      contentType: "article",
      html: null,
    };
  } catch {
    /* fall through */
  }
  return {
    title: "Financial Times",
    description: null,
    thumbnail: null,
    contentType: "article",
    html: null,
  };
}

// Bloomberg: bot UAs (facebookexternalhit → Twitterbot → Slackbot) to get og:tags directly
async function handleBloombergUrl(url: string): Promise<MetadataFull> {
  const BOT_UAS = [
    "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
    "Twitterbot/1.0",
    SLACKBOT_UA,
  ];
  for (const ua of BOT_UAS) {
    try {
      const resp = await fetch(url, {
        headers: { "User-Agent": ua, Accept: "text/html" },
        signal: AbortSignal.timeout(8000),
      });
      if (!resp.ok) continue;
      const html = await resp.text();
      const title = extractMetaContent(html, "og:title");
      if (!title) continue;
      return {
        title,
        description: extractMetaContent(html, "og:description"),
        thumbnail: extractMetaContent(html, "og:image"),
        contentType: "article",
        html: null,
      };
    } catch {
      /* try next UA */
    }
  }
  return {
    title: extractTitleFromUrl(url, "Bloomberg"),
    description: null,
    thumbnail: null,
    contentType: "article",
    html: null,
  };
}

// Reuters: Slackbot/Twitterbot UAs to get og:tags directly
async function handleReutersUrl(url: string): Promise<MetadataFull> {
  const BOT_UAS = [SLACKBOT_UA, "Twitterbot/1.0"];
  for (const ua of BOT_UAS) {
    try {
      const resp = await fetch(url, {
        headers: { "User-Agent": ua, Accept: "text/html" },
        signal: AbortSignal.timeout(8000),
      });
      if (!resp.ok) continue;
      const html = await resp.text();
      const title = extractMetaContent(html, "og:title");
      if (!title) continue;
      return {
        title,
        description: extractMetaContent(html, "og:description"),
        thumbnail: extractMetaContent(html, "og:image"),
        contentType: "article",
        html: null,
      };
    } catch {
      /* try next UA */
    }
  }
  return {
    title: extractTitleFromUrl(url, "Reuters"),
    description: null,
    thumbnail: null,
    contentType: "article",
    html: null,
  };
}
