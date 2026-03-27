"use client";
import { useEffect } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@kurate/query";

import { createClient } from "@/app/_libs/supabase/client";

const attempted = new Set<string>();
const supabase = createClient();

export function useRefreshLoggedItem(
  item: {
    id: string;
    url: string;
    title: string | null;
    preview_image_url: string | null;
  } | null | undefined,
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!item) return;
    const needsRefresh =
      !attempted.has(item.id) &&
      (item.title === item.url || (item.title?.startsWith("http") ?? false));
    if (!needsRefresh) return;
    attempted.add(item.id);

    void (async () => {
      try {
        const res = await fetch("/api/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
      } catch {}
    })();
  }, [item?.id]); // eslint-disable-line react-hooks/exhaustive-deps
}
