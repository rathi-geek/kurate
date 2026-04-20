import type { SupabaseClient } from '@supabase/supabase-js';

import type { ContentType, Database } from '@kurate/types';
import { generateUrlHash } from '@kurate/utils';

export interface SaveItemInput {
  url: string;
  title?: string | null;
  preview_image?: string | null;
  content_type?: ContentType;
  description?: string | null;
  // raw_metadata fields (stored as JSON blob on logged_items)
  source?: string | null;
  author?: string | null;
  read_time?: string | null;
  tags?: string[] | null;
  remarks?: string | null;
}

export type SaveItemResult =
  | { status: 'saved'; url: string; item: { id: string; logged_item_id: string } }
  | { status: 'duplicate'; url: string; item: { id: string; logged_item_id: string } }
  | { status: 'error'; url: string; message: string };

export async function saveItem(
  supabase: SupabaseClient<Database>,
  input: SaveItemInput,
): Promise<SaveItemResult> {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) return { status: 'error', url: input.url, message: userError.message };
    if (!user) return { status: 'error', url: input.url, message: 'Not authenticated' };

    const url_hash = await generateUrlHash(input.url);

    // 1) Upsert shared catalog row
    const { data: loggedItem, error: liError } = await supabase
      .from('logged_items')
      .upsert(
        {
          url: input.url,
          url_hash,
          title: input.title ?? input.url,
          content_type: input.content_type ?? 'article',
          preview_image_url: input.preview_image ?? null,
          description: input.description ?? null,
          tags: input.tags ?? null,
          raw_metadata: {
            source: input.source ?? null,
            author: input.author ?? null,
            read_time: input.read_time ?? null,
          },
        },
        { onConflict: 'url_hash' },
      )
      .select('id')
      .single();

    if (liError || !loggedItem) {
      return { status: 'error', url: input.url, message: liError?.message ?? 'Failed to upsert logged_items' };
    }

    // 2) Check if this user already has this URL in their vault
    const { data: existing, error: existingError } = await supabase
      .from('user_logged_items')
      .select('id')
      .eq('user_id', user.id)
      .eq('logged_item_id', loggedItem.id)
      .maybeSingle();

    if (existingError) {
      return { status: 'error', url: input.url, message: existingError.message };
    }

    if (existing) {
      return { status: 'duplicate', url: input.url, item: { id: existing.id, logged_item_id: loggedItem.id } };
    }

    // 3) Insert ownership row
    const { data: uli, error: uliError } = await supabase
      .from('user_logged_items')
      .insert({
        user_id: user.id,
        logged_item_id: loggedItem.id,
        save_source: 'web_extension',
        saved_from_group: null,
        remarks: input.remarks ?? null,
      })
      .select('id')
      .single();

    if (uliError) {
      // 23505 = race condition: another concurrent save won — treat as duplicate
      if (uliError.code === '23505') {
        const { data: raceExisting } = await supabase
          .from('user_logged_items')
          .select('id')
          .eq('user_id', user.id)
          .eq('logged_item_id', loggedItem.id)
          .single();
        return { status: 'duplicate', url: input.url, item: { id: raceExisting?.id ?? '', logged_item_id: loggedItem.id } };
      }
      return { status: 'error', url: input.url, message: uliError.message };
    }

    if (!uli) {
      return { status: 'error', url: input.url, message: 'Failed to insert user_logged_items' };
    }

    return { status: 'saved', url: input.url, item: { id: uli.id, logged_item_id: loggedItem.id } };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return { status: 'error', url: input.url, message };
  }
}

