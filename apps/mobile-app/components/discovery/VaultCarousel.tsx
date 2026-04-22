import { useCallback } from 'react';
import { View } from '@/components/ui/view';
import { FlashList } from '@shopify/flash-list';
import { decodeHtmlEntities } from '@kurate/utils';
import type { VaultDiscoveryItem } from '@kurate/hooks';
import { VaultDiscoveryCard } from '@/components/discovery/VaultDiscoveryCard';

interface VaultCarouselProps {
  items: VaultDiscoveryItem[];
}

function Separator() {
  return <View style={{ width: 12 }} />;
}

export function VaultCarousel({ items }: VaultCarouselProps) {
  const renderItem = useCallback(
    ({ item }: { item: VaultDiscoveryItem }) => (
      <VaultDiscoveryCard
        title={decodeHtmlEntities(item.title) ?? null}
        url={item.url}
        createdAt={item.created_at}
      />
    ),
    [],
  );

  const keyExtractor = useCallback((item: VaultDiscoveryItem) => item.id, []);

  return (
    <FlashList
      horizontal
      data={items}
      keyExtractor={keyExtractor}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16 }}
      ItemSeparatorComponent={Separator}
      renderItem={renderItem}
    />
  );
}
