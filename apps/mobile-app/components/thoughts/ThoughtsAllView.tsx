import { useCallback } from 'react';
import { FlatList } from 'react-native';
import { View } from '@/components/ui/view';
import { Spinner } from '@/components/ui/spinner';
import type { ThoughtBucket } from '@kurate/utils';
import { getBucketColors, lightTheme } from '@kurate/theme';
import { ThoughtBubble, type DisplayMessage } from './ThoughtBubble';
import { ThoughtsEmptyState } from './ThoughtsEmptyState';

const BUCKET_COLORS = getBucketColors(lightTheme) as Record<
  ThoughtBucket,
  string
>;

interface ThoughtsAllViewProps {
  messages: DisplayMessage[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onFetchMore: () => void;
  onDelete: (id: string) => void;
  isSearching: boolean;
}

export function ThoughtsAllView({
  messages,
  hasNextPage,
  isFetchingNextPage,
  onFetchMore,
  onDelete,
  isSearching,
}: ThoughtsAllViewProps) {
  const renderItem = useCallback(
    ({ item }: { item: DisplayMessage }) => (
      <ThoughtBubble
        message={item}
        bucketColor={BUCKET_COLORS[item.bucket]}
        showBucketLabel
        onLongPress={id => onDelete(id)}
      />
    ),
    [onDelete],
  );

  if (messages.length === 0) {
    return <ThoughtsEmptyState isSearching={isSearching} />;
  }

  return (
    <FlatList
      data={messages}
      keyExtractor={item => item.id}
      renderItem={renderItem}
      inverted
      contentContainerStyle={{
        gap: 8,
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
