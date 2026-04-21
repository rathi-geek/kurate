import { useCallback } from 'react';
import { FlashList } from '@shopify/flash-list';
import { View } from '@/components/ui/view';
import { Spinner } from '@/components/ui/spinner';

import { ThoughtBubble, type DisplayMessage } from './ThoughtBubble';
import { ThoughtsEmptyState } from './ThoughtsEmptyState';

interface ThoughtsAllViewProps {
  messages: DisplayMessage[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onFetchMore: () => void;
  onLongPress: (id: string, text: string) => void;
  isSearching: boolean;
  /** slug → hex color map for dynamic bucket colors */
  bucketColorMap: Record<string, string>;
  /** slug → label map for bucket labels */
  bucketLabelMap: Record<string, string>;
}

export function ThoughtsAllView({
  messages,
  hasNextPage,
  isFetchingNextPage,
  onFetchMore,
  onLongPress,
  isSearching,
  bucketColorMap,
  bucketLabelMap,
}: ThoughtsAllViewProps) {
  const renderItem = useCallback(
    ({ item }: { item: DisplayMessage }) => (
      <ThoughtBubble
        message={item}
        bucketColor={bucketColorMap[item.bucket] ?? '#D1FAE5'}
        bucketLabel={bucketLabelMap[item.bucket]}
        showBucketLabel
        onLongPress={(id, text) => onLongPress(id, text)}
      />
    ),
    [onLongPress, bucketColorMap, bucketLabelMap],
  );

  if (messages.length === 0) {
    return <ThoughtsEmptyState isSearching={isSearching} />;
  }

  return (
    <FlashList
      data={messages}
      keyExtractor={item => item.id}
      renderItem={renderItem}
      inverted
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingBottom: 16,
        paddingTop: 8,
      }}
      onEndReached={() => hasNextPage && onFetchMore()}
      onEndReachedThreshold={0.5}
      ListFooterComponent={
        isFetchingNextPage ? (
          <View className="items-center py-4">
            <Spinner className="text-primary" />
          </View>
        ) : null
      }
      showsVerticalScrollIndicator={false}
    />
  );
}
