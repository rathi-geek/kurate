/**
 * Extracts a repeated meta property from HTML (e.g. article:tag which appears multiple times).
 */
export function extractMultiMeta(html: string, property: string): string[] {
  const esc = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    `<meta[^>]+(?:property|name)=["']${esc}["'][^>]+content=["']([^"'<>]+)["']`,
    "gi",
  );
  const results: string[] = [];
  let match;
  while ((match = pattern.exec(html)) !== null) {
    if (match[1]) results.push(match[1].trim());
  }
  return results;
}

/**
 * Extracts a single meta property value from HTML.
 */
export function getSingleMeta(html: string, property: string): string | undefined {
  const esc = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(
      `<meta[^>]+(?:property|name)=["']${esc}["'][^>]+content=["']([^"'<>]+)["']`,
      "i",
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"'<>]+)["'][^>]+(?:property|name)=["']${esc}["']`,
      "i",
    ),
  ];
  for (const p of patterns) {
    const m = html.match(p);
    if (m?.[1]) return m[1].trim();
  }
  return undefined;
}

/**
 * Extracts content tags from scraped HTML.
 * Works for articles, videos, and podcasts using Open Graph and standard meta properties.
 *
 * Sources:
 *  - article:tag       — Medium, Substack, WordPress, news sites (may repeat)
 *  - article:section   — NYT, BBC, Guardian (single category value)
 *  - keywords          — older/CMS sites (comma-separated)
 *  - og:video:tag      — YouTube and some video platforms (may repeat)
 *  - music:genre       — Spotify podcasts
 */
export function extractTagsFromHtml(html: string): string[] {
  const tags: string[] = [];

  tags.push(...extractMultiMeta(html, "article:tag"));

  const section = getSingleMeta(html, "article:section");
  if (section) tags.push(section);

  const keywords = getSingleMeta(html, "keywords");
  if (keywords) {
    tags.push(...keywords.split(",").map((k) => k.trim()).filter(Boolean));
  }

  tags.push(...extractMultiMeta(html, "og:video:tag"));

  const genre = getSingleMeta(html, "music:genre");
  if (genre) tags.push(genre);

  // Deduplicate, drop empty/overly long values, cap at 6
  return [
    ...new Set(tags.map((t) => t.trim()).filter((t) => t.length > 0 && t.length < 50)),
  ].slice(0, 6);
}
