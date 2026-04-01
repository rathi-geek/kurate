"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createClient } from "@/app/_libs/supabase/client";
import { queryKeys } from "@kurate/query";
import type { ContentType, SaveSource } from "@kurate/types";

const supabase = createClient();

export async function generateUrlHash(url: string): Promise<string> {
  const normalized = url.toLowerCase().trim();
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export interface UpsertLoggedItemInput {
  url: string;
  title?: string | null;
  content_type?: ContentType | null;
  preview_image_url?: string | null;
  description?: string | null;
  source?: string | null;
  read_time?: string | null;
  tags?: string[] | null;
}

/** Upserts a URL into the shared logged_items catalog and returns its id. */
export async function upsertLoggedItem(input: UpsertLoggedItemInput): Promise<string> {
  const url_hash = await generateUrlHash(input.url);
  const { data, error } = await supabase
    .from("logged_items")
    .upsert(
      {
        url: input.url,
        url_hash,
        title: input.title ?? input.url,
        content_type: input.content_type ?? "article",
        preview_image_url: input.preview_image_url ?? null,
        description: input.description ?? null,
        tags: input.tags ?? null,
        raw_metadata: {
          source: input.source ?? null,
          read_time: input.read_time ?? null,
        },
      },
      { onConflict: "url_hash" },
    )
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data.id;
}

export interface SaveItemInput {
  url: string;
  title?: string | null;
  preview_image?: string | null;
  content_type?: ContentType;
  description?: string | null;
  save_source?: SaveSource;
  saved_from_group?: string | null;
  // raw_metadata fields (stored as JSON blob on logged_items)
  source?: string | null;
  author?: string | null;
  read_time?: string | null;
  tags?: string[] | null;
}

export interface SaveItemResult {
  status: "saved" | "duplicate" | "error";
  item?: {
    id: string;            // user_logged_items.id
    logged_item_id: string; // logged_items.id
  };
}

export function useSaveItem() {
  const queryClient = useQueryClient();

  return useMutation<SaveItemResult, Error, SaveItemInput>({
    mutationFn: async (input): Promise<SaveItemResult> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return { status: "error" };

      // 1. Upsert to logged_items (shared catalog — one row per unique URL)
      const loggedItemId = await upsertLoggedItem({
        url: input.url,
        title: input.title,
        content_type: input.content_type,
        preview_image_url: input.preview_image ?? null,
        description: input.description,
        source: input.source,
        read_time: input.read_time,
        tags: input.tags,
      });
      const loggedItem = { id: loggedItemId };

      // 2. Check if user already has this item in their vault
      const { data: existing } = await supabase
        .from("user_logged_items")
        .select("id")
        .eq("user_id", user.id)
        .eq("logged_item_id", loggedItem.id)
        .maybeSingle();

      if (existing) return { status: "duplicate", item: { id: existing.id, logged_item_id: loggedItem.id } };

      // 3. Insert ownership record
      const { data: uli, error: uliError } = await supabase
        .from("user_logged_items")
        .insert({
          user_id: user.id,
          logged_item_id: loggedItem.id,
          save_source: input.save_source ?? "external",
          saved_from_group: input.saved_from_group ?? null,
        })
        .select("id")
        .single();

      if (uliError) throw new Error(uliError.message);

      return {
        status: "saved",
        item: { id: uli.id, logged_item_id: loggedItem.id },
      };
    },
    onSuccess: (result) => {
      if (result.status === "saved") {
        void queryClient.refetchQueries({ queryKey: queryKeys.vault.all });
      }
    },
  });
}
