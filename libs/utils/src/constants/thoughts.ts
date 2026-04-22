/** Bucket slug — dynamic string, not a fixed union */
export type ThoughtBucket = string;

/** System bucket slugs — cannot be renamed or deleted */
export const SYSTEM_BUCKET_SLUGS = ["tasks", "notes"] as const;
export type SystemBucketSlug = (typeof SYSTEM_BUCKET_SLUGS)[number];

/** Maximum number of buckets per user (system + custom) */
export const MAX_BUCKETS = 10;

/** Maximum bucket name length */
export const MAX_BUCKET_NAME_LENGTH = 25;

/** Legacy BUCKET_META — kept for backward compat during migration */
export const BUCKET_META: Record<string, { label: string; colorVar: string }> = {
  tasks: { label: "Tasks",         colorVar: "--bucket-tasks" },
  notes: { label: "Notes to Self", colorVar: "--bucket-notes" },
};

/**
 * Predefined background colors for buckets (base -100/-200 shades).
 * When creating a bucket, pick from this palette and store the hex in the DB.
 */
export const BUCKET_COLOR_PALETTE = [
  "#D1FAE5", // emerald-100 (tasks default)
  "#FEF3C7", // amber-100   (notes default)
  "#DBEAFE", // blue-100
  "#FBCFE8", // pink-200
  "#DDD6FE", // violet-200
  "#FED7AA", // orange-200
  "#A5F3FC", // cyan-200
  "#FECACA", // red-200
  "#C7D2FE", // indigo-200
  "#BBF7D0", // green-200
] as const;

/**
 * Mid-tone dot colors paired with the palette above (same index).
 * Used for bucket indicator dots in popovers and lists.
 */
export const BUCKET_DOT_PALETTE = [
  "#10B981", // emerald-500
  "#F59E0B", // amber-500
  "#3B82F6", // blue-500
  "#EC4899", // pink-500
  "#8B5CF6", // violet-500
  "#EA580C", // orange-600
  "#0891B2", // cyan-600
  "#DC2626", // red-600
  "#6366F1", // indigo-500
  "#16A34A", // green-600
] as const;

/**
 * Dark accent badge colors paired with the palette above (same index).
 * Used for unread count badges.
 */
export const BUCKET_BADGE_PALETTE = [
  "#065F46", // emerald-900
  "#92400E", // amber-900
  "#1E40AF", // blue-800
  "#9D174D", // pink-800
  "#4C1D95", // violet-900
  "#9A3412", // orange-800
  "#155E75", // cyan-800
  "#991B1B", // red-800
  "#3730A3", // indigo-800
  "#166534", // green-800
] as const;

/** Legacy BUCKET_BADGE_COLOR — kept for backward compat */
export const BUCKET_BADGE_COLOR: Record<string, string> = {
  tasks: "#065F46",
  notes: "#92400E",
};

function paletteIndex(bgColor: string): number {
  const upper = bgColor.toUpperCase();
  return BUCKET_COLOR_PALETTE.findIndex((c) => c.toUpperCase() === upper);
}

/** Get the dark badge color that pairs with a bucket's background hex */
export function getBucketBadgeColor(bgColor: string): string {
  const idx = paletteIndex(bgColor);
  return idx >= 0 ? BUCKET_BADGE_PALETTE[idx] : BUCKET_BADGE_PALETTE[0];
}

/** Get the mid-tone dot color that pairs with a bucket's background hex */
export function getBucketDotColor(bgColor: string): string {
  const idx = paletteIndex(bgColor);
  return idx >= 0 ? BUCKET_DOT_PALETTE[idx] : BUCKET_DOT_PALETTE[0];
}

/** Pick the next unused color from the palette based on existing bucket colors */
export function nextBucketColor(usedColors: string[]): string {
  const usedSet = new Set(usedColors.map((c) => c.toUpperCase()));
  const available = BUCKET_COLOR_PALETTE.find((c) => !usedSet.has(c.toUpperCase()));
  return available ?? BUCKET_COLOR_PALETTE[usedColors.length % BUCKET_COLOR_PALETTE.length];
}

/** Sort bucket summaries: pinned first, then by most recent message */
export function sortBucketSummaries<T extends { isPinned: boolean; latestCreatedAt: string | null }>(
  summaries: T[],
): T[] {
  return [...summaries].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    const aTime = a.latestCreatedAt ? new Date(a.latestCreatedAt).getTime() : 0;
    const bTime = b.latestCreatedAt ? new Date(b.latestCreatedAt).getTime() : 0;
    return bTime - aTime;
  });
}

/** Generate a URL-safe slug from a bucket label */
export function bucketSlug(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 30);
}

/** Keyword map — only covers system buckets */
export const THOUGHT_KEYWORD_MAP: Record<SystemBucketSlug, string[]> = {
  tasks: ["buy", "call", "reply", "finish", "send", "book", "schedule", "todo", "fix", "submit"],
  notes: [
    "remember", "note", "don't forget", "remind", "dentist", "backup", "trip",
    "watch", "listen", "movie", "episode", "video", "music", "podcast", "film", "show",
    "read", "study", "learn", "look into", "understand", "research", "revisit", "explore",
  ],
};

/** Keyword-based bucket classifier — only classifies into system buckets */
export function classifyThought(text: string): SystemBucketSlug {
  const lower = text.toLowerCase();
  for (const bucket of SYSTEM_BUCKET_SLUGS) {
    if (THOUGHT_KEYWORD_MAP[bucket].some((kw) => lower.includes(kw))) return bucket;
  }
  return "notes";
}
