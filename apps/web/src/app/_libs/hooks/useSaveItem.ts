"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createClient } from "@/app/_libs/supabase/client";
import { queryKeys } from "@/app/_libs/query/keys";
import type { ContentType } from "@/app/_libs/types/vault";

const supabase = createClient();

export interface SaveItemInput {
  url: string;
  title?: string | null;
  source?: string | null;
  author?: string | null;
  preview_image?: string | null;
  content_type?: ContentType;
  read_time?: string | null;
  save_source?: "logged" | "feed" | "discovered";
}

export type SaveItemResult = "saved" | "duplicate" | "error";

export function useSaveItem() {
  const queryClient = useQueryClient();

  return useMutation<SaveItemResult, Error, SaveItemInput>({
    mutationFn: async (input): Promise<SaveItemResult> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return "error";

      // Check duplicate before insert
      const { data: existing } = await supabase
        .from("logged_items")
        .select("id")
        .eq("user_id", user.id)
        .eq("url", input.url)
        .maybeSingle();

      if (existing) return "duplicate";

      const { error } = await supabase.from("logged_items").upsert(
        {
          user_id: user.id,
          url: input.url,
          title: input.title ?? input.url,
          source: input.source ?? null,
          author: input.author ?? null,
          preview_image: input.preview_image ?? null,
          content_type: input.content_type ?? "article",
          read_time: input.read_time ?? null,
          save_source: input.save_source ?? "logged",
          shared_to_groups: [],
        },
        { onConflict: "user_id,url" },
      );

      if (error) throw new Error(error.message);
      return "saved";
    },
    onSuccess: (result) => {
      if (result === "saved") {
        queryClient.invalidateQueries({ queryKey: queryKeys.vault.all });
      }
    },
  });
}
