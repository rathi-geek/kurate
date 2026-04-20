import { useCallback, useMemo, useState } from 'react';
import { FlashList } from '@shopify/flash-list';
import { View } from '@/components/ui/view';
import { VStack } from '@/components/ui/vstack';
import { Text } from '@/components/ui/text';
import { Skeleton } from '@/components/ui/skeleton';
import { useLocalization } from '@/context';
import { useAuthStore } from '@/store';
import { supabase } from '@/libs/supabase/client';
import { useDiscoveryFeed, useDiscoveryVault } from '@kurate/hooks';
import type { VaultDiscoveryItem } from '@kurate/hooks';
import type { GroupDrop } from '@kurate/types';
import { formatDateLabel } from '@kurate/utils';
import { FeedDropCard } from '@/components/groups/feed-drop-card';
import { SectionDivider } from '@/components/discovery/SectionDivider';
import { VaultCarousel } from '@/components/discovery/VaultCarousel';

type DiscoveryListItem =
  | { type: 'vault-header'; key: string }
  | { type: 'vault-carousel'; key: string; items: VaultDiscoveryItem[] }
  | { type: 'section-header'; key: string; label: string }
  | { type: 'drop'; key: string; drop: GroupDrop }
  | { type: 'empty'; key: string };

const noopDelete = async () => {};

export function DiscoveringTabView() {
  const { t } = useLocalization();
  const userId = useAuthStore(s => s.userId) ?? '';

  const {
    todayDrops,
    newDrops,
    isLoading: feedLoading,
    refetch: feedRefetch,
  } = useDiscoveryFeed(supabase, userId);

  const {
    data: vaultItems,
    isLoading: vaultLoading,
    refetch: vaultRefetch,
  } = useDiscoveryVault(supabase, userId);

  const [refreshing, setRefreshing] = useState(false);

  const isLoading = feedLoading || vaultLoading;

  const listData = useMemo((): DiscoveryListItem[] => {
    if (isLoading) return [];

    const items: DiscoveryListItem[] = [];

    // Vault section
    if (vaultItems && vaultItems.length > 0) {
      items.push({ type: 'vault-header', key: 'vault-header' });
      items.push({
        type: 'vault-carousel',
        key: 'vault-carousel',
        items: vaultItems,
      });
    }

    // Today section
    if (todayDrops.length > 0) {
      const todayLabel = `${t('discovery.today')} \u00B7 ${formatDateLabel()}`;
      items.push({
        type: 'section-header',
        key: 'today-header',
        label: todayLabel,
      });
      for (const drop of todayDrops) {
        items.push({ type: 'drop', key: `today-${drop.id}`, drop });
      }
    }

    // New section
    if (newDrops.length > 0) {
      items.push({
        type: 'section-header',
        key: 'new-header',
        label: t('discovery.new_since_visit'),
      });
      for (const drop of newDrops) {
        items.push({ type: 'drop', key: `new-${drop.id}`, drop });
      }
    }

    // Empty state
    if (
      todayDrops.length === 0 &&
      newDrops.length === 0 &&
      (!vaultItems || vaultItems.length === 0)
    ) {
      items.push({ type: 'empty', key: 'empty' });
    }

    return items;
  }, [isLoading, vaultItems, todayDrops, newDrops, t]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([feedRefetch(), vaultRefetch()]);
    setRefreshing(false);
  }, [feedRefetch, vaultRefetch]);

  if (isLoading) {
    return (
      <VStack className="flex-1 gap-4 p-4">
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </VStack>
    );
  }

  return (
    <FlashList
      data={listData}
      keyExtractor={item => item.key}
      getItemType={item => item.type}
      estimatedItemSize={200}
      refreshing={refreshing}
      onRefresh={handleRefresh}
      contentContainerStyle={{ paddingBottom: 16 }}
      renderItem={({ item }) => {
        switch (item.type) {
          case 'vault-header':
            return <SectionDivider label={t('discovery.from_vault')} />;
          case 'vault-carousel':
            return <VaultCarousel items={item.items} />;
          case 'section-header':
            return <SectionDivider label={item.label} />;
          case 'drop':
            return (
              <View className="px-4 py-2">
                <FeedDropCard drop={item.drop} onDelete={noopDelete} />
              </View>
            );
          case 'empty':
            return (
              <VStack className="flex-1 items-center justify-center gap-2 px-8 py-16">
                <Text className="text-center font-sans text-sm font-medium text-foreground">
                  {t('discovery.empty_title')}
                </Text>
                <Text className="text-center font-sans text-xs text-muted-foreground">
                  {t('discovery.empty_subtitle')}
                </Text>
              </VStack>
            );
          default:
            return null;
        }
      }}
    />
  );
}
