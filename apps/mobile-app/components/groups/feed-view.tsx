import React, { useCallback, useEffect, useRef } from 'react';
import { FlashList, type FlashListRef } from '@shopify/flash-list';
import { VStack } from '@/components/ui/vstack';
import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { Spinner } from '@/components/ui/spinner';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertText } from '@/components/ui/alert';
import { useLocalization } from '@/context';
import { supabase } from '@/libs/supabase/client';
import { useAuthStore } from '@/store';
import { useGroupFeed } from '@kurate/hooks';
import type { GroupDrop } from '@kurate/types';
import { FeedDropCard } from '@/components/groups/feed-drop-card';

interface FeedViewProps {
  groupId: string;
  currentRole?: string;
}

export function FeedView({ groupId, currentRole }: FeedViewProps) {
  const { t } = useLocalization();
  const userId = useAuthStore(state => state.userId) ?? '';

  const {
    drops,
    deleteDrop,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetchingNextPage,
    isError,
    refetch,
  } = useGroupFeed(supabase, groupId, userId);

  // Avoids scroll-jacking when other users post — we only react to drops authored by `userId`.
  const listRef = useRef<FlashListRef<GroupDrop>>(null);
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

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderItem = useCallback(
    ({ item }: { item: GroupDrop }) => (
      <FeedDropCard
        drop={item}
        currentUserId={userId}
        currentRole={currentRole}
        onDelete={deleteDrop}
      />
    ),
    [userId, currentRole, deleteDrop],
  );

  const renderFooter = useCallback(
    () =>
      isFetchingNextPage ? (
        <View className="items-center py-4">
          <Spinner />
        </View>
      ) : null,
    [isFetchingNextPage],
  );

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

  return (
    <FlashList
      ref={listRef}
      data={drops}
      keyExtractor={d => d.id}
      renderItem={renderItem}
      style={{ padding: 16 }}
      showsVerticalScrollIndicator={false}
      ItemSeparatorComponent={() => <View className="h-3" />}
      ListFooterComponent={renderFooter}
      ListEmptyComponent={
        <View className="items-center p-8">
          <Text className="text-center font-sans text-sm text-muted-foreground">
            {t('groups.feed_empty')}
          </Text>
        </View>
      }
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.5}
      onRefresh={refetch}
      refreshing={isLoading}
    />
  );
}
