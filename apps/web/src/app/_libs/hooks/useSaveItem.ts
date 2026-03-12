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

export interface SaveItemResult {
  status: "saved" | "duplicate" | "error";
  item?: { id: string; shared_to_groups: string[] };
}

export function useSaveItem() {
  const queryClient = useQueryClient();

  return useMutation<SaveItemResult, Error, SaveItemInput>({
    mutationFn: async (input): Promise<SaveItemResult> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return { status: "error" };

      // Check duplicate before insert
      const { data: existing } = await supabase
        .from("logged_items")
        .select("id")
        .eq("user_id", user.id)
        .eq("url", input.url)
        .maybeSingle();

      if (existing) return { status: "duplicate" };

      const { data, error } = await supabase
        .from("logged_items")
        .upsert(
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
        )
        .select("id, shared_to_groups")
        .single();

      if (error) throw new Error(error.message);
      return {
        status: "saved",
        item: {
          id: data.id,
          shared_to_groups: (data.shared_to_groups as string[] | null) ?? [],
        },
      };
    },
    onSuccess: (result) => {
      if (result.status === "saved") {
        queryClient.invalidateQueries({ queryKey: queryKeys.vault.all });
      }
    },
  });
}
