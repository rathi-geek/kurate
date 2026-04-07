import React, { useCallback, useState } from 'react';
import { FlatList } from 'react-native';
import { View } from '@/components/ui/view';
import { Spinner } from '@/components/ui/spinner';
import { useMobileVault } from '@/hooks/useVault';
import type { VaultFilters, VaultItem } from '@kurate/types';
import { VaultCard } from './VaultCard';
import { VaultCardSkeleton } from './VaultCardSkeleton';
import { VaultEmptyState } from './VaultEmptyState';
import { VaultErrorState } from './VaultErrorState';
import { VaultShareSheet } from './VaultShareSheet';

interface VaultListProps {
  filters: VaultFilters;
}

const SKELETON_DATA = [1, 2, 3, 4];

function VaultListFooter({ isLoadingMore }: { isLoadingMore: boolean }) {
  if (!isLoadingMore) return null;
  return (
    <View className="items-center py-4">
      <Spinner className="text-primary" />
    </View>
  );
}

function hasNonDefaultFilters(filters: VaultFilters): boolean {
  return (
    filters.time !== 'all' ||
    filters.contentType !== 'all' ||
    filters.readStatus !== 'all' ||
    filters.search !== ''
  );
}

export function VaultList({ filters }: VaultListProps) {
  const {
    items,
    isLoading,
    isLoadingMore,
    isError,
    hasMore,
    loadMore,
    refetch,
    deleteItem,
    toggleRead,
  } = useMobileVault(filters);

  const [shareItem, setShareItem] = useState<VaultItem | null>(null);

  const handleEndReached = useCallback(() => {
    if (hasMore) loadMore();
  }, [hasMore, loadMore]);

  const renderItem = useCallback(
    ({ item }: { item: VaultItem }) => (
      <VaultCard
        item={item}
        onToggleRead={toggleRead}
        onDelete={deleteItem}
        onShare={setShareItem}
      />
    ),
    [toggleRead, deleteItem],
  );

  const keyExtractor = useCallback((item: VaultItem) => item.id, []);

  if (isLoading) {
    return (
      <FlatList
        data={SKELETON_DATA}
        keyExtractor={item => String(item)}
        renderItem={() => <VaultCardSkeleton />}
        contentContainerStyle={{
          gap: 12,
          paddingHorizontal: 16,
          paddingBottom: 16,
          paddingTop: 12,
        }}
        scrollEnabled={false}
      />
    );
  }

  if (isError) {
    return <VaultErrorState onRetry={refetch} />;
  }

  if (items.length === 0) {
    return (
      <VaultEmptyState
        variant={hasNonDefaultFilters(filters) ? 'filtered' : 'default'}
        filters={filters}
      />
    );
  }

  return (
    <>
      <FlatList
        data={items}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={{
          gap: 12,
          paddingHorizontal: 16,
          paddingBottom: 16,
          paddingTop: 12,
        }}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        ListFooterComponent={<VaultListFooter isLoadingMore={isLoadingMore} />}
        refreshing={false}
        onRefresh={refetch}
        showsVerticalScrollIndicator={false}
      />
      <VaultShareSheet
        open={!!shareItem}
        item={shareItem}
        onClose={() => setShareItem(null)}
      />
    </>
  );
}
