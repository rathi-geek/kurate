import { useCallback, useState } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
import type { SupabaseClient } from "@supabase/supabase-js";
import type { QueryClient } from "@tanstack/react-query";

import { queryKeys } from "@kurate/query";
import type { ThoughtBucket } from "@kurate/utils";

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
}

export function useSubmitContent(config: SubmitContentConfig) {
  const [isPending, setIsPending] = useState(false);
  const saveItem = useSaveItem(config.supabase);

  const onSend = useCallback(
    async (text: string, mediaFile?: File, preExtractedMeta?: ExtractedMeta | null, note?: string | null, tempId?: string) => {
      const urlMatch = !mediaFile && text.match(URL_REGEX);
      setIsPending(true);
      try {
        if (urlMatch) {
          // ── URL path → logged_items ──────────────────────────────────────
          const url = urlMatch[0];
          const base = config.apiBaseUrl ?? "";

          const meta: ExtractedMeta | null =
            preExtractedMeta ??
            (await fetch(`${base}/api/extract`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
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
          // ── Text / media path → thoughts ─────────────────────────────────
          let media_id: string | null = null;

          if (mediaFile) {
            const {
              data: { user },
            } = await config.supabase.auth.getUser();
            if (!user) return;

            const ext = mediaFile.name.split(".").pop() ?? "jpg";
            const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

            const { error: uploadError } = await config.supabase.storage
              .from("thoughts")
              .upload(path, mediaFile);
            if (uploadError) return;

            // media_metadata is not in generated types
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: mediaRow } = await (config.supabase as any)
              .from("media_metadata")
              .insert({
                bucket_name: "thoughts",
                file_name: mediaFile.name,
                file_path: path,
                file_size: mediaFile.size,
                file_type: mediaFile.type,
                is_public: false,
                owner_id: user.id,
                provider: "supabase",
              })
              .select("id")
              .single();

            media_id = (mediaRow as { id: string } | null)?.id ?? null;
          }

          const base = config.apiBaseUrl ?? "";
          const thoughtRes = await fetch(`${base}/api/thoughts`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              content_type: media_id ? "image" : "text",
              text: text || null,
              ...(media_id ? { media_id } : {}),
              ...(config.activeBucket ? { bucket: config.activeBucket } : {}),
            }),
          });

          if (thoughtRes.ok) {
            const thought = (await thoughtRes.json()) as ThoughtMessage;
            // Inject into React Query cache (avoids a second GET)
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
            // Fallback: invalidate so next focus re-fetches
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
