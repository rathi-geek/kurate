/**
 * Centralized query key factory.
 *
 * Rules:
 * - Always use `as const` for type safety
 * - Broader keys (e.g. queryKeys.vault.all) invalidate all sub-keys
 * - queryClient.invalidateQueries({ queryKey: queryKeys.vault.all })
 *   will invalidate vault.list, vault.detail, etc.
 */

import type { VaultFilters } from "@/app/_libs/types/vault";

export const queryKeys = {
  // ─── Vault ────────────────────────────────────────────────────────
  vault: {
    all: ["vault"] as const,
    list: (filters: VaultFilters) => ["vault", "list", filters] as const,
  },

  // ─── Feed / Discover ──────────────────────────────────────────────
  feed: {
    all: ["feed"] as const,
    trending: () => ["feed", "trending"] as const,
    forYou: () => ["feed", "forYou"] as const,
  },

  // ─── User ─────────────────────────────────────────────────────────
  user: {
    all: ["user"] as const,
    profile: (id: string) => ["user", "profile", id] as const,
  },

  // ─── Groups ───────────────────────────────────────────────────────
  groups: {
    all: ["groups"] as const,
    list: () => ["groups", "list"] as const,
    detail: (slug: string) => ["groups", "detail", slug] as const,
    feed: (groupId: string) => ["groups", "feed", groupId] as const,
    members: (groupId: string) => ["groups", "members", groupId] as const,
    engagement: (groupShareId: string) =>
      ["groups", "engagement", groupShareId] as const,
    comments: (groupShareId: string) =>
      ["groups", "comments", groupShareId] as const,
    vaultItem: (userId: string, url: string) =>
      ["groups", "vaultItem", userId, url] as const,
  },
} as const;
