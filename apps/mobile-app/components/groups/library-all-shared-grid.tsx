import React, { useCallback } from 'react';
import { FlashList } from '@shopify/flash-list';
import { View } from '@/components/ui/view';
import { VStack } from '@/components/ui/vstack';
import { Text } from '@/components/ui/text';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertText } from '@/components/ui/alert';
import { useLocalization } from '@/context';
import { supabase } from '@/libs/supabase/client';
import { useGroupFeed } from '@/hooks/useGroupFeed';
import type { GroupDrop } from '@kurate/types';
import { LibraryCard } from '@/components/groups/library-card';
import { LibraryGridSkeleton } from '@/components/groups/library-grid-skeleton';

interface LibraryAllSharedGridProps {
  groupId: string;
  userId: string;
  onPress?: (dropId: string) => void;
}

export function LibraryAllSharedGrid({
  groupId,
  userId,
  onPress,
}: LibraryAllSharedGridProps) {
  const { t } = useLocalization();
  const {
    drops,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetchingNextPage,
    isError,
    refetch,
  } = useGroupFeed(supabase, groupId, userId);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderItem = useCallback(
    ({ item }: { item: GroupDrop }) => (
      <LibraryCard drop={item} currentUserId={userId} onPress={onPress} />
    ),
    [userId, onPress],
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

  if (isLoading && drops.length === 0) return <LibraryGridSkeleton />;

  if (isError) {
    return (
      <Alert variant="destructive" className="mx-4 my-2">
        <AlertText>{t('groups.error_generic')}</AlertText>
      </Alert>
    );
  }

  if (drops.length === 0) {
    return (
      <VStack className="flex-1 items-center justify-center p-8">
        <Text className="text-center font-sans text-sm text-muted-foreground">
          {t('groups.library_empty')}
        </Text>
      </VStack>
    );
  }

  return (
    <FlashList
      data={drops}
      keyExtractor={d => d.id}
      renderItem={renderItem}
      numColumns={2}
      ListFooterComponent={renderFooter}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.5}
      contentContainerStyle={{ paddingHorizontal: 12 }}
      onRefresh={refetch}
      refreshing={isLoading}
    />
  );
}
