import { useCallback, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchUserGroups, type GroupRow } from '@kurate/hooks';
import { queryKeys } from '@kurate/query';
import { supabase, supabaseUrl } from '@/libs/supabase/client';

const LAST_SEEN_PREFIX = 'group:lastSeen:';
const COUNTS_KEY_BASE = 'group-unread-counts';

export interface UseGroupUnreadCountsResult {
  /** Unread count for a single group (0 if unknown). */
  getCount: (groupId: string) => number;
  /** Sum of all groups' unread counts. */
  totalUnread: number;
  /** Mark a group as read — writes Date.now() to AsyncStorage + zeroes its count. */
  markRead: (groupId: string) => Promise<void>;
}

/**
 * Per-group unread badges driven by AsyncStorage last-seen + Supabase realtime.
 * Same query cache as the Groups list screen — both surfaces share data.
 */
export function useGroupUnreadCounts(
  userId: string,
): UseGroupUnreadCountsResult {
  const queryClient = useQueryClient();

  // Reuse the same query key as the Groups list screen so both share data.
  const groupsQuery = useQuery({
    queryKey: queryKeys.groups.list(),
    queryFn: () => fetchUserGroups(supabase, supabaseUrl),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });

  const groupIds = useMemo(
    () => (groupsQuery.data ?? []).map((g: GroupRow) => g.id),
    [groupsQuery.data],
  );

  const countsKey = useMemo(
    () => [COUNTS_KEY_BASE, userId, groupIds.slice().sort().join(',')],
    [userId, groupIds],
  );

  const countsQuery = useQuery<Record<string, number>>({
    queryKey: countsKey,
    queryFn: async () => {
      if (groupIds.length === 0) return {};
      const lastSeenEntries = await Promise.all(
        groupIds.map(async id => {
          const v = await AsyncStorage.getItem(`${LAST_SEEN_PREFIX}${id}`);
          return [id, v ? parseInt(v, 10) : 0] as const;
        }),
      );
      const lastSeenByGroup = Object.fromEntries(lastSeenEntries) as Record<
        string,
        number
      >;
      const countEntries = await Promise.all(
        groupIds.map(async id => {
          const since = new Date(lastSeenByGroup[id] ?? 0).toISOString();
          const { count } = await supabase
            .from('group_posts')
            .select('id', { count: 'exact', head: true })
            .eq('convo_id', id)
            .neq('shared_by', userId)
            .gt('shared_at', since);
          return [id, count ?? 0] as const;
        }),
      );
      return Object.fromEntries(countEntries);
    },
    enabled: !!userId && groupIds.length > 0,
    staleTime: 1000 * 30,
  });

  // Realtime: live-increment the count for the affected group on new posts by others.
  useEffect(() => {
    if (!userId || groupIds.length === 0) return;
    const idSet = new Set(groupIds);
    const channel = supabase
      .channel(`group-unread:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'group_posts' },
        payload => {
          const post = payload.new as {
            convo_id: string;
            shared_by: string;
          };
          if (!idSet.has(post.convo_id)) return;
          if (post.shared_by === userId) return;
          queryClient.setQueryData<Record<string, number>>(countsKey, old => ({
            ...(old ?? {}),
            [post.convo_id]: (old?.[post.convo_id] ?? 0) + 1,
          }));
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, groupIds, countsKey, queryClient]);

  const counts = countsQuery.data ?? {};
  const totalUnread = useMemo(
    () => Object.values(counts).reduce((a, b) => a + b, 0),
    [counts],
  );

  const getCount = useCallback(
    (groupId: string) => counts[groupId] ?? 0,
    [counts],
  );

  const markRead = useCallback(
    async (groupId: string) => {
      const now = Date.now();
      await AsyncStorage.setItem(`${LAST_SEEN_PREFIX}${groupId}`, String(now));
      queryClient.setQueryData<Record<string, number>>(countsKey, old => ({
        ...(old ?? {}),
        [groupId]: 0,
      }));
    },
    [countsKey, queryClient],
  );

  return { getCount, totalUnread, markRead };
}
