"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@kurate/types";

export interface GroupRow {
  id: string;
  name: string;
  avatarUrl: string | null;
  description: string | null;
  role: string;
  joined_at: string;
}

export async function fetchUserGroups(
  supabase: SupabaseClient<Database>,
  supabaseUrl: string,
): Promise<GroupRow[]> {
  const storageBase = `${supabaseUrl}/storage/v1/object/public/`;

  const { data, error } = await supabase.rpc("get_user_groups");

  if (error) return [];

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.group_name ?? "",
    avatarUrl: row.avatar_path ? `${storageBase}${row.avatar_path}` : null,
    description: row.group_description ?? null,
    role: row.role as string,
    joined_at: row.joined_at,
  }));
}
