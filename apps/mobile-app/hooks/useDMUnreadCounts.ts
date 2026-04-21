import { useState, useEffect, useCallback } from 'react';
import { AppState } from 'react-native';

import { supabase } from '@/libs/supabase/client';
import { useAuthStore } from '@/store';

/**
 * Tracks unread DM counts per conversation using server-side RPCs.
 * Re-implemented for mobile — the shared lib version uses `document.visibilityState`
 * which crashes on React Native. This version uses `AppState` instead.
 */
export function useDMUnreadCounts() {
  const userId = useAuthStore(state => state.userId);
  const [counts, setCounts] = useState<Map<string, number>>(new Map());

  const fetchCounts = useCallback(async () => {
    if (!userId) return;

    const { data, error } = await supabase.rpc('get_dm_unread_counts', {
      p_user_id: userId,
    });

    if (error) {
      console.error('[useDMUnreadCounts] fetch error:', error);
      return;
    }

    const map = new Map<string, number>();
    for (const row of data ?? []) {
      if (row.unread_count > 0) {
        map.set(row.convo_id, row.unread_count);
      }
    }
    setCounts(map);
  }, [userId]);

  // Initial fetch + realtime subscription
  useEffect(() => {
    if (!userId) return;
    void fetchCounts();

    const channel = supabase
      .channel('dm-unread-counts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        payload => {
          const msg = payload.new as { convo_id: string; sender_id: string };
          if (msg.sender_id === userId) return;
          setCounts(prev => {
            const next = new Map(prev);
            next.set(msg.convo_id, (next.get(msg.convo_id) ?? 0) + 1);
            return next;
          });
        },
      )
      .subscribe((_status, err) => {
        if (err) console.error('[useDMUnreadCounts] subscription error:', err);
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, fetchCounts]);

  // Re-fetch counts when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') {
        void fetchCounts();
      }
    });
    return () => subscription.remove();
  }, [fetchCounts]);

  const markRead = useCallback(
    async (convoId: string) => {
      if (!userId) return;

      // Optimistically clear count
      setCounts(prev => {
        const next = new Map(prev);
        next.delete(convoId);
        return next;
      });

      const { error } = await supabase.rpc('mark_conversation_read', {
        p_user_id: userId,
        p_convo_id: convoId,
      });

      if (error) {
        console.error('[useDMUnreadCounts] markRead error:', error);
      }
    },
    [userId],
  );

  const totalDMUnread = Array.from(counts.values()).reduce((s, n) => s + n, 0);

  return { counts, markRead, totalDMUnread };
}
