import { generateUrlHash, type UpsertLoggedItemInput } from '@kurate/hooks';
import { supabase } from '@/libs/supabase/client';

export type { UpsertLoggedItemInput };

/** Upserts a URL into the shared logged_items catalog and returns its id. */
export async function upsertLoggedItem(
  input: UpsertLoggedItemInput,
): Promise<string> {
  const url_hash = await generateUrlHash(input.url);
  const { data, error } = await supabase
    .from('logged_items')
    .upsert(
      {
        url: input.url,
        url_hash,
        title: input.title ?? input.url,
        content_type: input.content_type ?? 'article',
        preview_image_url: input.preview_image_url ?? null,
        description: input.description ?? null,
        tags: input.tags ?? null,
        raw_metadata: {
          source: input.source ?? null,
          read_time: input.read_time ?? null,
        },
      },
      { onConflict: 'url_hash' },
    )
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  return data.id;
}
