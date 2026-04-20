import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@kurate/types';

function getRequiredEnv(
  name: 'NEXT_PUBLIC_SUPABASE_URL' | 'NEXT_PUBLIC_SUPABASE_ANON_KEY' | 'NEXT_PUBLIC_APP_URL',
): string {
  const value = (import.meta as any).env?.[name] as string | undefined;
  if (!value) throw new Error(`Missing env: ${name}`);
  return value;
}

let client: SupabaseClient<Database> | null = null;

export function getSupabaseClient(): SupabaseClient<Database> {
  if (client) return client;

  client = createClient<Database>(
    getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL'),
    getRequiredEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    {
      auth: {
        // Extension owns persistence via chrome.storage.local
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );

  return client;
}

export function getAppUrl(): string {
  return getRequiredEnv('NEXT_PUBLIC_APP_URL').replace(/\/+$/, '');
}

