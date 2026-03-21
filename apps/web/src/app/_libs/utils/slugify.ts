/**
 * Convert a group name to a URL-safe slug.
 * "Design Team" → "design-team"
 * "AI Research 🚀" → "ai-research"
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") // strip non-word chars (emoji, punctuation)
    .replace(/[\s_]+/g, "-") // spaces/underscores → hyphens
    .replace(/^-+|-+$/g, ""); // trim leading/trailing hyphens
}
