import { useMutation, useQueryClient } from "@tanstack/react-query";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import type { SupabaseClient } from "@supabase/supabase-js";

import { queryKeys } from "@kurate/query";
import type { ContentType, SaveSource } from "@kurate/types";

export async function generateUrlHash(url: string): Promise<string> {
  const normalized = url.toLowerCase().trim();
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export interface SaveItemInput {
  url: string;
  title?: string | null;
  preview_image?: string | null;
  content_type?: ContentType;
  description?: string | null;
  save_source?: SaveSource;
  saved_from_group?: string | null;
  source?: string | null;
  author?: string | null;
  read_time?: string | null;
  tags?: string[] | null;
  remarks?: string | null;
}

export interface SaveItemResult {
  status: "saved" | "duplicate" | "error";
  item?: {
    id: string;
    logged_item_id: string;
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useSaveItem(supabase: SupabaseClient<any>) {
  const queryClient = useQueryClient();

  return useMutation<SaveItemResult, Error, SaveItemInput>({
    mutationFn: async (input): Promise<SaveItemResult> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return { status: "error" };

      const url_hash = await generateUrlHash(input.url);

      const { data: loggedItem, error: liError } = await supabase
        .from("logged_items")
        .upsert(
          {
            url: input.url,
            url_hash,
            title: input.title ?? input.url,
            content_type: input.content_type ?? "article",
            preview_image_url: input.preview_image ?? null,
            description: input.description ?? null,
            tags: input.tags ?? null,
            raw_metadata: {
              source: input.source ?? null,
              author: input.author ?? null,
              read_time: input.read_time ?? null,
            },
          },
          { onConflict: "url_hash" },
        )
        .select("id")
        .single();

      if (liError) throw new Error(liError.message);

      const { data: existing } = await supabase
        .from("user_logged_items")
        .select("id")
        .eq("user_id", user.id)
        .eq("logged_item_id", loggedItem.id)
        .maybeSingle();

      if (existing)
        return { status: "duplicate", item: { id: existing.id, logged_item_id: loggedItem.id } };

      const { data: uli, error: uliError } = await supabase
        .from("user_logged_items")
        .insert({
          user_id: user.id,
          logged_item_id: loggedItem.id,
          save_source: input.save_source ?? "external",
          saved_from_group: input.saved_from_group ?? null,
          remarks: input.remarks ?? null,
        })
        .select("id")
        .single();

      if (uliError) throw new Error(uliError.message);

      return { status: "saved", item: { id: uli.id, logged_item_id: loggedItem.id } };
    },
    onSuccess: (result) => {
      if (result.status === "saved") {
        void queryClient.refetchQueries({ queryKey: queryKeys.vault.all });
      }
    },
  });
}
