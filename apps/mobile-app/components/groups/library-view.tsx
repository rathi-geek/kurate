import React, { useCallback, useEffect, useMemo } from 'react';
import { FlashList } from '@shopify/flash-list';
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
import { LibraryCard } from '@/components/groups/library-card';

interface LibraryViewProps {
  groupId: string;
  /** Called when a card is pressed — typically switches the group view to Feed. */
  onNavigateToFeed?: (dropId: string) => void;
}

type ListItem =
  | { kind: 'header'; key: string; label: string }
  | { kind: 'drop'; key: string; drop: GroupDrop };

export function LibraryView({ groupId, onNavigateToFeed }: LibraryViewProps) {
  const { t } = useLocalization();
  const userId = useAuthStore(state => state.userId) ?? '';

  const {
    drops,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetchingNextPage,
    isError,
    refetch,
  } = useGroupFeed(supabase, groupId, userId);

  // Eagerly load all pages so MUST READ + ALL SHARED reflect the full library.
  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const items = useMemo<ListItem[]>(() => {
    const mustRead = drops.filter(d => d.engagement.mustRead.count > 0);
    const all = drops;
    const out: ListItem[] = [];
    if (mustRead.length > 0) {
      out.push({
        kind: 'header',
        key: 'must-read-header',
        label: t('groups.must_read'),
      });
      mustRead.forEach(d =>
        out.push({ kind: 'drop', key: `mr-${d.id}`, drop: d }),
      );
    }
    if (all.length > 0) {
      out.push({
        kind: 'header',
        key: 'all-shared-header',
        label: t('groups.all_shared'),
      });
      all.forEach(d => out.push({ kind: 'drop', key: `all-${d.id}`, drop: d }));
    }
    return out;
  }, [drops, t]);

  const renderItem = useCallback(
    ({ item }: { item: ListItem }) => {
      if (item.kind === 'header') {
        return (
          <Text className="mx-4 mb-1 mt-4 font-sans text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {item.label}
          </Text>
        );
      }
      return (
        <LibraryCard
          drop={item.drop}
          currentUserId={userId}
          onPress={onNavigateToFeed}
        />
      );
    },
    [userId, onNavigateToFeed],
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
          <Skeleton
            key={i}
            className="w-full rounded-xl"
            style={{ aspectRatio: 16 / 9 }}
          />
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
      data={items}
      keyExtractor={i => i.key}
      renderItem={renderItem}
      ListFooterComponent={renderFooter}
      onRefresh={refetch}
      refreshing={isLoading}
    />
  );
}
