import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@kurate/query';
import type { PendingThoughtRow } from '@kurate/hooks';
import {
  useBuckets,
  useMoveBucket,
  useThoughts,
  useBucketSummaries,
  type BucketSummary,
  useDeleteThought,
  useBucketLastRead,
} from '@kurate/hooks';
import { sortBucketSummaries } from '@kurate/utils';
import { Plus } from 'lucide-react-native';
import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { Pressable } from '@/components/ui/pressable';
import { Icon } from '@/components/ui/icon';
import { useLocalization } from '@/context';
import { useAuthStore } from '@/store';
import { usePendingStore } from '@/store/usePendingStore';
import { supabase } from '@/libs/supabase/client';
import { BucketCard } from './BucketCard';
import { BucketCardSkeleton } from './BucketCardSkeleton';
import { ThoughtsAllView } from './ThoughtsAllView';
import { ThoughtsBucketChat } from './ThoughtsBucketChat';
import { ThoughtActionSheet } from './ThoughtActionSheet';
import { CreateBucketSheet } from './CreateBucketSheet';
import { BucketOptionsSheet } from './BucketOptionsSheet';
import type { DisplayMessage } from './ThoughtBubble';

/** Convert a pending thought row to a DisplayMessage */
function pendingToMessage(p: PendingThoughtRow): DisplayMessage {
  return {
    id: p.tempId,
    bucket: p.bucket,
    text: p.text,
    created_at: p.createdAt,
    media_id: p.media_id,
    content_type: p.content_type,
    _pending: p.status === 'sending',
    _failed: p.status === 'failed',
  };
}

interface ThoughtsTabViewProps {
  searchQuery: string;
  viewAll?: boolean;
  onViewAllChange?: (v: boolean) => void;
}

export function ThoughtsTabView({
  searchQuery,
  viewAll: viewAllProp,
  onViewAllChange,
}: ThoughtsTabViewProps) {
  const { t } = useLocalization();
  const userId = useAuthStore(state => state.userId);
  const [viewAllLocal, setViewAllLocal] = useState(false);
  const viewAll = viewAllProp ?? viewAllLocal;
  const setViewAll = onViewAllChange ?? setViewAllLocal;
  const [activeBucket, setActiveBucket] = useState<string | null>(null);
  const isSearching = searchQuery.length > 0;

  // Sheets state
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const [actionSheet, setActionSheet] = useState<{
    thoughtId: string;
    bucket: string;
  } | null>(null);
  const [optionsSheet, setOptionsSheet] = useState<{
    summary: BucketSummary;
    bucketId: string;
  } | null>(null);

  const supaConfig = { supabase, userId: userId ?? null };
  const { data: summaries, isLoading: summariesLoading } =
    useBucketSummaries(supaConfig);
  const { messages: serverMessages, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useThoughts(supaConfig, activeBucket, searchQuery);
  const deleteMutation = useDeleteThought({ supabase });
  const moveMutation = useMoveBucket({ supabase });
  const { markBucketRead } = useBucketLastRead(supaConfig);
  const queryClient = useQueryClient();

  const {
    buckets,
    createBucket,
    renameBucket,
    deleteBucket,
    togglePin,
    isCreating,
  } = useBuckets({ supabase, userId: userId ?? null });

  // ── Pending thoughts from Zustand store ──
  const pendingThoughts = usePendingStore(s => s.pendingThoughts);
  const deletePendingThought = usePendingStore(s => s.deletePendingThought);

  // Dedup: clean up pending entries already confirmed by server
  useEffect(() => {
    if (!pendingThoughts.length || !serverMessages.length) return;
    const serverTexts = new Set(serverMessages.map(m => m.text));
    const confirmed = pendingThoughts.filter(p => serverTexts.has(p.text));
    for (const p of confirmed) {
      deletePendingThought(p.tempId);
    }
  }, [serverMessages, pendingThoughts, deletePendingThought]);

  // Merge pending into display messages (deduped)
  const serverTexts = useMemo(
    () => new Set(serverMessages.map(m => m.text)),
    [serverMessages],
  );
  const pendingMessages: DisplayMessage[] = !isSearching
    ? pendingThoughts
        .filter(p => !serverTexts.has(p.text))
        .map(pendingToMessage)
    : [];
  const displayMessages: DisplayMessage[] = [
    ...pendingMessages,
    ...(serverMessages as DisplayMessage[]),
  ];

  // ── Merge pending into bucket summaries ──
  const mergedSummaries = useMemo<BucketSummary[]>(() => {
    if (!summaries) return [];
    if (pendingThoughts.length === 0) return summaries;

    const pendingByBucket = new Map<string, PendingThoughtRow[]>();
    for (const p of pendingThoughts) {
      const list = pendingByBucket.get(p.bucket) ?? [];
      list.push(p);
      pendingByBucket.set(p.bucket, list);
    }

    return summaries.map(s => {
      const bp = pendingByBucket.get(s.bucket);
      if (!bp?.length) return s;
      const latestPending = bp.reduce((a, b) =>
        new Date(b.createdAt).getTime() > new Date(a.createdAt).getTime()
          ? b
          : a,
      );
      const pendingIsNewer =
        !s.latestCreatedAt ||
        new Date(latestPending.createdAt).getTime() >
          new Date(s.latestCreatedAt).getTime();
      return {
        ...s,
        latestText: pendingIsNewer ? latestPending.text : s.latestText,
        latestCreatedAt: pendingIsNewer
          ? latestPending.createdAt
          : s.latestCreatedAt,
        totalCount: s.totalCount + bp.length,
      };
    });
  }, [summaries, pendingThoughts]);

  // Build lookup maps from merged summaries
  const bucketColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const s of mergedSummaries) {
      map[s.bucket] = s.color;
    }
    return map;
  }, [mergedSummaries]);

  const bucketLabelMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const s of mergedSummaries) {
      map[s.bucket] = s.bucketLabel;
    }
    return map;
  }, [mergedSummaries]);

  // Find the active bucket's summary for passing props
  const activeSummary = useMemo(
    () => mergedSummaries.find(s => s.bucket === activeBucket),
    [mergedSummaries, activeBucket],
  );

  const handleBucketPress = useCallback(
    (bucket: string) => {
      markBucketRead(bucket);
      queryClient.setQueryData<BucketSummary[]>(
        queryKeys.thoughts.bucketSummaries(),
        prev =>
          prev?.map(s => (s.bucket === bucket ? { ...s, unreadCount: 0 } : s)),
      );
      setActiveBucket(bucket);
    },
    [markBucketRead, queryClient],
  );

  const handleBucketLongPress = useCallback(
    (summary: BucketSummary) => {
      if (summary.isSystem) return;
      const bucketRow = buckets.find(b => b.slug === summary.bucket);
      if (!bucketRow) return;
      setOptionsSheet({ summary, bucketId: bucketRow.id });
    },
    [buckets],
  );

  const handleThoughtLongPress = useCallback(
    (id: string, _text: string) => {
      const msg = displayMessages.find(m => m.id === id);
      setActionSheet({
        thoughtId: id,
        bucket: msg?.bucket ?? activeBucket ?? 'notes',
      });
    },
    [displayMessages, activeBucket],
  );

  const handleDelete = useCallback(
    (id: string) => {
      // Check if it's a pending thought
      const isPending = pendingThoughts.some(p => p.tempId === id);
      if (isPending) {
        deletePendingThought(id);
        return;
      }
      deleteMutation.mutate(id);
    },
    [pendingThoughts, deletePendingThought, deleteMutation],
  );

  const handleMove = useCallback(
    (thoughtId: string, newBucket: string) => {
      moveMutation.mutate({ thoughtId, newBucket });
    },
    [moveMutation],
  );

  return (
    <View className="flex-1">
      <View className="items-end px-5 py-2">
        <Pressable onPress={() => setViewAll(!viewAll)}>
          <Text className="text-xs text-foreground/50 underline">
            {viewAll
              ? t('thoughts.view_buckets')
              : t('thoughts.view_all_chats')}
          </Text>
        </Pressable>
      </View>

      {viewAll ? (
        <ThoughtsAllView
          messages={displayMessages}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          onFetchMore={fetchNextPage}
          onLongPress={handleThoughtLongPress}
          isSearching={isSearching}
          bucketColorMap={bucketColorMap}
          bucketLabelMap={bucketLabelMap}
        />
      ) : summariesLoading ? (
        <BucketCardSkeleton />
      ) : (
        <ScrollView
          contentContainerStyle={{
            gap: 8,
            paddingHorizontal: 20,
            paddingBottom: 16,
          }}
          showsVerticalScrollIndicator={false}
        >
          {sortBucketSummaries(mergedSummaries).map(s => (
            <BucketCard
              key={s.bucket}
              slug={s.bucket}
              label={s.bucketLabel}
              color={s.color}
              isPinned={s.isPinned}
              isSystem={s.isSystem}
              latestText={s.latestText}
              latestCreatedAt={s.latestCreatedAt}
              unreadCount={s.unreadCount}
              onPress={() => handleBucketPress(s.bucket)}
              onLongPress={() => handleBucketLongPress(s)}
            />
          ))}
          {/* Create bucket button */}
          <Pressable
            onPress={() => setCreateSheetOpen(true)}
            className="flex-row items-center justify-center gap-2 rounded-xl border border-dashed border-border px-4 py-3"
          >
            <Icon as={Plus} size="xs" className="text-muted-foreground" />
            <Text className="font-sans text-sm text-muted-foreground">
              {t('thoughts.create_bucket')}
            </Text>
          </Pressable>
        </ScrollView>
      )}

      {activeBucket && activeSummary && (
        <ThoughtsBucketChat
          bucket={activeBucket}
          bucketLabel={activeSummary.bucketLabel}
          color={activeSummary.color}
          messages={displayMessages}
          searchQuery={searchQuery}
          onBack={() => setActiveBucket(null)}
          onLongPress={handleThoughtLongPress}
        />
      )}

      {/* Create Bucket Sheet */}
      <CreateBucketSheet
        open={createSheetOpen}
        onClose={() => setCreateSheetOpen(false)}
        onCreateBucket={createBucket}
        isCreating={isCreating}
      />

      {/* Thought Action Sheet (move / delete) */}
      <ThoughtActionSheet
        open={!!actionSheet}
        thoughtId={actionSheet?.thoughtId ?? null}
        currentBucket={actionSheet?.bucket ?? null}
        buckets={mergedSummaries}
        onClose={() => setActionSheet(null)}
        onMove={handleMove}
        onDelete={handleDelete}
      />

      {/* Bucket Options Sheet (rename / delete / pin) */}
      <BucketOptionsSheet
        open={!!optionsSheet}
        bucket={optionsSheet?.summary ?? null}
        bucketId={optionsSheet?.bucketId ?? null}
        onClose={() => setOptionsSheet(null)}
        onRename={renameBucket}
        onDelete={deleteBucket}
        onTogglePin={togglePin}
      />
    </View>
  );
}
