"use client";

import { useComments as _useComments, fetchComments as _fetchComments } from "@kurate/hooks";

import { createClient } from "@/app/_libs/supabase/client";

const supabase = createClient();

export function fetchComments(groupPostId: string, cursor: string | null) {
  return _fetchComments(supabase, groupPostId, cursor);
}

export function useComments(
  groupPostId: string,
  groupId?: string,
  currentUserProfile?: { id: string; display_name: string | null; avatar_path: string | null; handle: string },
) {
  return _useComments(supabase, groupPostId, groupId, currentUserProfile);
}
