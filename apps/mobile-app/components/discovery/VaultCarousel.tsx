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
  return (
    <FlashList
      horizontal
      data={items}
      keyExtractor={item => item.id}
      estimatedItemSize={176}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16 }}
      ItemSeparatorComponent={Separator}
      renderItem={({ item }) => (
        <VaultDiscoveryCard
          title={decodeHtmlEntities(item.title) ?? null}
          url={item.url}
          createdAt={item.created_at}
        />
      )}
    />
  );
}
