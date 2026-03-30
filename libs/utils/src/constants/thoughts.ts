export type ThoughtBucket = "media" | "tasks" | "learning" | "notes";

export const THOUGHT_BUCKETS: ThoughtBucket[] = ["media", "tasks", "learning", "notes"];

export const BUCKET_META: Record<ThoughtBucket, { label: string; colorVar: string }> = {
  media:    { label: "Media",         colorVar: "--bucket-media" },
  tasks:    { label: "Tasks",         colorVar: "--bucket-tasks" },
  learning: { label: "Learning",      colorVar: "--bucket-learning" },
  notes:    { label: "Notes to Self", colorVar: "--bucket-notes" },
};

export const THOUGHT_KEYWORD_MAP: Record<ThoughtBucket, string[]> = {
  media:    ["watch", "listen", "movie", "episode", "video", "music", "podcast", "film", "show"],
  tasks:    ["buy", "call", "reply", "finish", "send", "book", "schedule", "todo", "fix", "submit"],
  learning: ["read", "study", "learn", "look into", "understand", "research", "revisit", "explore"],
  notes:    ["remember", "note", "don't forget", "remind", "dentist", "backup", "trip"],
};

/** Dark accent color for each bucket — used for unread badge backgrounds */
export const BUCKET_BADGE_COLOR: Record<ThoughtBucket, string> = {
  media:    "#BE185D", // pink-700
  tasks:    "#065F46", // emerald-900
  learning: "#1D4ED8", // blue-700
  notes:    "#92400E", // amber-900
};

/** Keyword-based bucket classifier — works in any JS environment (web, mobile, server) */
export function classifyThought(text: string): ThoughtBucket {
  const lower = text.toLowerCase();
  for (const bucket of ["media", "tasks", "learning", "notes"] as ThoughtBucket[]) {
    if (THOUGHT_KEYWORD_MAP[bucket].some((kw) => lower.includes(kw))) return bucket;
  }
  return "notes";
}
