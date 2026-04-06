export type ThoughtBucket = "tasks" | "notes";

export const THOUGHT_BUCKETS: ThoughtBucket[] = ["tasks", "notes"];

export const BUCKET_META: Record<ThoughtBucket, { label: string; colorVar: string }> = {
  tasks: { label: "Tasks",         colorVar: "--bucket-tasks" },
  notes: { label: "Notes to Self", colorVar: "--bucket-notes" },
};

export const THOUGHT_KEYWORD_MAP: Record<ThoughtBucket, string[]> = {
  tasks: ["buy", "call", "reply", "finish", "send", "book", "schedule", "todo", "fix", "submit"],
  notes: [
    "remember", "note", "don't forget", "remind", "dentist", "backup", "trip",
    "watch", "listen", "movie", "episode", "video", "music", "podcast", "film", "show",
    "read", "study", "learn", "look into", "understand", "research", "revisit", "explore",
  ],
};

/** Dark accent color for each bucket — used for unread badge backgrounds */
export const BUCKET_BADGE_COLOR: Record<ThoughtBucket, string> = {
  tasks: "#065F46", // emerald-900
  notes: "#92400E", // amber-900
};

/** Keyword-based bucket classifier — works in any JS environment (web, mobile, server) */
export function classifyThought(text: string): ThoughtBucket {
  const lower = text.toLowerCase();
  for (const bucket of ["tasks", "notes"] as ThoughtBucket[]) {
    if (THOUGHT_KEYWORD_MAP[bucket].some((kw) => lower.includes(kw))) return bucket;
  }
  return "notes";
}
