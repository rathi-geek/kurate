"use client";

import { useEffect, useRef } from "react";

import { useQueryClient } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";

import { queryKeys } from "@kurate/query";
import type { Database } from "@kurate/types";

const attempted = new Set<string>();

export interface RefreshableItem {
  id: string;
  url: string;
  title: string | null;
  preview_image_url: string | null;
}

/**
 * If a logged_item's title is just the raw URL (metadata wasn't extracted at
 * post time), fire a one-shot `/api/extract` call and update the DB row so the
 * card re-renders with real metadata.
 *
 * @param item — the logged item to check (null/undefined = skip)
 * @param supabase — supabase client for updating the row
 * @param apiBaseUrl — base URL for the extract API (empty string for web relative, full URL for mobile)
 * @param accessToken — optional auth token (web uses cookies, mobile passes Supabase token)
 */
export function useRefreshLoggedItem(
  item: RefreshableItem | null | undefined,
  supabase: SupabaseClient<Database>,
  apiBaseUrl = "",
  accessToken?: string | null,
) {
  const queryClient = useQueryClient();
  const accessTokenRef = useRef(accessToken);
  accessTokenRef.current = accessToken;

  useEffect(() => {
    if (!item) return;
    const needsRefresh =
      !attempted.has(item.id) &&
      (item.title === item.url || (item.title?.startsWith("http") ?? false));
    if (!needsRefresh) return;
    attempted.add(item.id);

    const base = apiBaseUrl.replace(/\/+$/, "");

    void (async () => {
      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (accessTokenRef.current) {
          headers["Authorization"] = `Bearer ${accessTokenRef.current}`;
        }
        const res = await fetch(`${base}/api/extract`, {
          method: "POST",
          headers,
          body: JSON.stringify({ url: item.url }),
        });
        if (!res.ok) return;
        const meta = await res.json();
        await supabase
          .from("logged_items")
          .update({
            title: meta.title ?? item.url,
            content_type: meta.contentType ?? "article",
            preview_image_url: meta.previewImage ?? null,
            raw_metadata: {
              source: meta.source ?? null,
              read_time: meta.readTime ?? null,
            },
          })
          .eq("id", item.id);
        queryClient.invalidateQueries({ queryKey: queryKeys.vault.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.groups.all });
      } catch {
        // Silent — best-effort refresh
      }
    })();
  }, [item?.id]); // eslint-disable-line react-hooks/exhaustive-deps
}
