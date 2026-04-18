import { useEffect, useMemo } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { useGroupFeed as useSharedGroupFeed } from '@kurate/hooks';
import type { Database } from '@kurate/types';
import { usePendingStore } from '@/store/usePendingStore';
import { mobilePendingDb } from '@/libs/pending-db';

const CONFIRMED_LINGER_MS = 2000;

export function useGroupFeed(
  supabase: SupabaseClient<Database>,
  groupId: string,
  currentUserId: string,
) {
  const allPending = usePendingStore(s => s.pendingGroupPosts ?? []);
  const pendingPosts = useMemo(
    () => allPending.filter(p => p.convo_id === groupId),
    [allPending, groupId],
  );

  const result = useSharedGroupFeed(
    supabase,
    groupId,
    currentUserId,
    pendingPosts,
  );

  // Linger effect: confirmed rows stay for 2s then get deleted from pending store
  useEffect(() => {
    if (!pendingPosts.length) return;
    const confirmed = pendingPosts.filter(p => p.status === 'confirmed');
    if (!confirmed.length) return;
    const timer = setTimeout(() => {
      void Promise.all(
        confirmed.map(p => mobilePendingDb.deletePendingGroupPost(p.tempId)),
      );
    }, CONFIRMED_LINGER_MS);
    return () => clearTimeout(timer);
  }, [pendingPosts]);

  return result;
}
