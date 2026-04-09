import { useCallback, useRef, useState } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
import type { SupabaseClient } from "@supabase/supabase-js";
import type { QueryClient } from "@tanstack/react-query";

import { queryKeys } from "@kurate/query";
import { classifyThought, type ThoughtBucket } from "@kurate/utils";

import { useSaveItem, type SaveItemResult } from "./useSaveItem";

export const URL_REGEX = /https?:\/\/[^\s]+/;

interface ExtractedMeta {
  title?: string | null;
  source?: string | null;
  author?: string | null;
  previewImage?: string | null;
  contentType?: string | null;
  readTime?: number | string | null;
  tags?: string[] | null;
}

interface ThoughtMessage {
  id: string;
  bucket: ThoughtBucket;
  text: string;
  createdAt: string;
  media_id?: string | null;
  content_type?: string;
}

interface InfiniteThoughtsData {
  pages: { items: ThoughtMessage[]; nextCursor: string | null }[];
  pageParams: unknown[];
}

interface SubmitContentConfig {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>;
  queryClient: QueryClient;
  /** Called after save so the UI can switch to the correct tab/screen */
  onRouted: (destination: "links" | "thoughts") => void;
  /** Called with the save result so the UI can show toasts / share flow */
  onLinkSaved?: (result: SaveItemResult) => void | Promise<void>;
  /**
   * Called after a thought is persisted. Receives the confirmed thought and
   * the tempId so the caller can delete the Dexie pending row.
   */
  onThoughtSent?: (thought: ThoughtMessage, tempId: string) => Promise<void> | void;
  activeBucket?: ThoughtBucket | null;
  /** Base URL for API calls. Leave empty for web (relative). Full URL for mobile. */
  apiBaseUrl?: string;
  /** Optional auth token for API calls. Web uses cookies. Mobile passes Supabase access token. */
  accessToken?: string | null;
}

export interface SendOptions {
  meta?: ExtractedMeta | null;
  remarks?: string | null;
  tempId?: string;
}

export function useSubmitContent(config: SubmitContentConfig) {
  const [isPending, setIsPending] = useState(false);
  const saveItem = useSaveItem(config.supabase);
  const accessTokenRef = useRef(config.accessToken);
  accessTokenRef.current = config.accessToken;

  function authHeaders(): Record<string, string> {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (accessTokenRef.current) {
      h["Authorization"] = `Bearer ${accessTokenRef.current}`;
    }
    return h;
  }

  const onSend = useCallback(
    async (text: string, opts?: SendOptions) => {
      const { meta: preExtractedMeta, remarks: note, tempId } = opts ?? {};
      const urlMatch = text.match(URL_REGEX);
      setIsPending(true);
      try {
        if (urlMatch) {
          // ── URL path → logged_items ──────────────────────────────────────
          const url = urlMatch[0];
          const base = (config.apiBaseUrl ?? "").replace(/\/+$/, "");

          const meta: ExtractedMeta | null =
            preExtractedMeta ??
            (await fetch(`${base}/api/extract`, {
              method: "POST",
              headers: authHeaders(),
              body: JSON.stringify({ url }),
            })
              .then((r) => (r.ok ? (r.json() as Promise<ExtractedMeta>) : null))
              .catch(() => null));

          const result = await saveItem.mutateAsync({
            url,
            title: meta?.title ?? url,
            source: meta?.source ?? null,
            author: meta?.author ?? null,
            preview_image: meta?.previewImage ?? null,
            content_type:
              (meta?.contentType as "article" | "video" | "podcast") ?? "link",
            read_time: meta?.readTime != null ? String(meta.readTime) : null, // normalise number | string → string
            save_source: "external",
            tags: meta?.tags ?? null,
            remarks: note ?? null,
          });

          // TODO: Re-enable when Anthropic API credits are topped up
          // if (result.item) {
          //   void fetch(`${base}/api/classify-content`, {
          //     method: "POST",
          //     headers: { "Content-Type": "application/json" },
          //     body: JSON.stringify({
          //       logged_item_id: result.item.logged_item_id,
          //       title: meta?.title ?? url,
          //       description: null,
          //       tags: meta?.tags ?? [],
          //       content_type: meta?.contentType ?? "article",
          //     }),
          //   });
          // }

          await config.onLinkSaved?.(result);
          config.onRouted("links");
        } else {
          // ── Text path → thoughts (direct Supabase, no API route needed) ──
          const bucket: ThoughtBucket = config.activeBucket ?? classifyThought(text);

          const { data: { user } } = await config.supabase.auth.getUser();
          if (!user) {
            config.onRouted("thoughts");
            return;
          }

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data, error } = await (config.supabase as any)
            .from("thoughts")
            .insert({
              user_id: user.id,
              content_type: "text",
              text: text || null,
              bucket,
              bucket_source: config.activeBucket ? "user" : "auto",
            })
            .select()
            .single();

          if (!error && data) {
            const thought: ThoughtMessage = {
              id: data.id as string,
              bucket: data.bucket as ThoughtBucket,
              text: (data.text as string) ?? "",
              createdAt: data.created_at as string,
              media_id: null,
              content_type: "text",
            };
            // Inject into React Query cache
            config.queryClient.setQueryData<InfiniteThoughtsData>(
              queryKeys.thoughts.list(null),
              (old) => {
                if (!old) return old;
                const pages = old.pages.map((p, i) =>
                  i === 0 ? { ...p, items: [thought, ...p.items] } : p,
                );
                return { ...old, pages };
              },
            );
            void config.queryClient.invalidateQueries({ queryKey: queryKeys.thoughts.bucketSummaries() });
            if (tempId) {
              await config.onThoughtSent?.(thought, tempId);
            }
          } else {
            await config.queryClient.invalidateQueries({ queryKey: queryKeys.thoughts.all });
          }

          config.onRouted("thoughts");
        }
      } finally {
        setIsPending(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      config.supabase,
      config.queryClient,
      config.apiBaseUrl,
      config.activeBucket,
      config.onRouted,
      config.onLinkSaved,
      config.onThoughtSent,
      saveItem,
    ],
  );

  return { onSend, isPending };
}
