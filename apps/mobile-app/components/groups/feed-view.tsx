import React, { useCallback, useEffect, useRef } from 'react';
import { FlashList, type FlashListRef } from '@shopify/flash-list';
import { VStack } from '@/components/ui/vstack';
import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertText } from '@/components/ui/alert';
import { useLocalization } from '@/context';
import { supabase } from '@/libs/supabase/client';
import { mobilePendingDb } from '@/libs/pending-db';
import { useAuthStore } from '@/store';
import { useProfile } from '@/hooks/useProfile';
import { useGroupFeed } from '@/hooks/useGroupFeed';
import { useGroupComposer } from '@/hooks/useGroupComposer';
import type { GroupFeedEntry } from '@kurate/hooks';
import {
  FeedEntryItem,
  ItemSeparator,
  LoadingFooter,
} from '@/components/groups/feed-list-parts';
import { DropComposer } from '@/components/groups/drop-composer';

interface FeedViewProps {
  groupId: string;
  currentRole?: string;
  scrollToDropId?: string | null;
  onScrollComplete?: () => void;
  openCommentsForDropId?: string | null;
  onCommentsOpened?: () => void;
}

export function FeedView({
  groupId,
  currentRole,
  scrollToDropId,
  onScrollComplete,
  openCommentsForDropId,
  onCommentsOpened,
}: FeedViewProps) {
  const { t } = useLocalization();
  const userId = useAuthStore(state => state.userId) ?? '';
  const { data: profile } = useProfile(userId || undefined);

  const currentUserProfile = profile
    ? {
        id: profile.id,
        display_name:
          [profile.firstName, profile.lastName].filter(Boolean).join(' ') ||
          null,
        avatar_path: profile.avatarPath,
        handle: profile.handle,
      }
    : null;

  const {
    drops,
    entries,
    deleteDrop,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetchingNextPage,
    isError,
    refetch,
  } = useGroupFeed(supabase, groupId, userId);

  const composer = useGroupComposer({
    groupId,
    currentUserId: userId,
    supabase,
    currentUserProfile,
  });

  const handleRetry = useCallback(
    (tempId: string) => {
      void composer.retry(tempId);
    },
    [composer],
  );

  const handleDismiss = useCallback((tempId: string) => {
    void mobilePendingDb.deletePendingGroupPost(tempId);
  }, []);

  const listRef = useRef<FlashListRef<GroupFeedEntry>>(null);
  const prevTopIdRef = useRef<string | null>(null);

  useEffect(() => {
    const top = drops[0];
    if (!top) {
      prevTopIdRef.current = null;
      return;
    }
    const isNewTop =
      prevTopIdRef.current !== null && top.id !== prevTopIdRef.current;
    prevTopIdRef.current = top.id;
    if (isNewTop && top.shared_by === userId) {
      listRef.current?.scrollToOffset({ offset: 0, animated: true });
    }
  }, [drops, userId]);

  // Scroll to a specific drop (triggered from library card tap)
  useEffect(() => {
    if (!scrollToDropId || !entries.length) return;
    const index = entries.findIndex(
      e => e.kind === 'confirmed' && e.data.id === scrollToDropId,
    );
    if (index >= 0) {
      // Small delay to let FlashList finish layout after tab switch
      setTimeout(() => {
        listRef.current?.scrollToIndex({ index, animated: true });
        onScrollComplete?.();
      }, 100);
    } else {
      onScrollComplete?.();
    }
  }, [scrollToDropId, entries, onScrollComplete]);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderItem = useCallback(
    ({ item }: { item: GroupFeedEntry }) => (
      <FeedEntryItem
        entry={item}
        currentRole={currentRole}
        onDelete={deleteDrop}
        onRetry={handleRetry}
        onDismiss={handleDismiss}
        openCommentsForDropId={openCommentsForDropId}
        onCommentsOpened={onCommentsOpened}
      />
    ),
    [currentRole, deleteDrop, handleRetry, handleDismiss, openCommentsForDropId, onCommentsOpened],
  );

  const keyExtractor = useCallback(
    (entry: GroupFeedEntry) =>
      entry.kind === 'pending' ? `pending-${entry.data.tempId}` : entry.data.id,
    [],
  );

  const getItemType = useCallback((item: GroupFeedEntry) => item.kind, []);

  if (isLoading && drops.length === 0) {
    return (
      <VStack className="gap-3 p-4">
        {[0, 1, 2].map(i => (
          <Skeleton key={i} className="h-40 w-full rounded-xl" />
        ))}
      </VStack>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive" className="mx-4 my-2">
        <AlertText>{t('groups.error_generic')}</AlertText>
      </Alert>
    );
  }

  const emptyComponent = (
    <View className="items-center p-8">
      <Text className="text-center font-sans text-sm text-muted-foreground">
        {t('groups.feed_empty')}
      </Text>
    </View>
  );

  return (
    <View className="flex-1">
      <FlashList
        ref={listRef}
        data={entries}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        getItemType={getItemType}
        style={{ paddingHorizontal: 16, paddingTop: 0 }}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={ItemSeparator}
        ListFooterComponent={isFetchingNextPage ? LoadingFooter : null}
        ListEmptyComponent={emptyComponent}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        onRefresh={refetch}
        refreshing={isLoading}
      />
      <View className="bg-background py-2">
        <DropComposer groupId={groupId} />
      </View>
    </View>
  );
}
