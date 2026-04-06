import { useCallback, useState } from 'react';
import { ScrollView } from 'react-native';
import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { Pressable } from '@/components/ui/pressable';
import { useLocalization } from '@/context';
import { useThoughts } from '@/hooks/useThoughts';
import { useBucketSummaries } from '@/hooks/useBucketSummaries';
import { useDeleteThought } from '@/hooks/useDeleteThought';
import { useBucketLastRead } from '@/hooks/useBucketLastRead';
import type { ThoughtBucket } from '@kurate/utils';
import { BucketCard } from './BucketCard';
import { BucketCardSkeleton } from './BucketCardSkeleton';
import { ThoughtsAllView } from './ThoughtsAllView';
import { ThoughtsBucketChat } from './ThoughtsBucketChat';
import type { DisplayMessage } from './ThoughtBubble';

interface ThoughtsTabViewProps {
  searchQuery: string;
}

export function ThoughtsTabView({ searchQuery }: ThoughtsTabViewProps) {
  const { t } = useLocalization();
  const [viewAll, setViewAll] = useState(false);
  const [activeBucket, setActiveBucket] = useState<ThoughtBucket | null>(null);

  const { data: summaries, isLoading: summariesLoading } = useBucketSummaries();
  const { messages, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useThoughts(activeBucket, searchQuery);
  const deleteMutation = useDeleteThought();
  const { markBucketRead } = useBucketLastRead();

  const handleBucketPress = useCallback(
    (bucket: ThoughtBucket) => {
      markBucketRead(bucket);
      setActiveBucket(bucket);
    },
    [markBucketRead],
  );

  const handleDelete = useCallback(
    (id: string) => {
      deleteMutation.mutate(id);
    },
    [deleteMutation],
  );

  const displayMessages: DisplayMessage[] = messages;
  const isSearching = searchQuery.length > 0;

  return (
    <View className="flex-1">
      <View className="items-end px-5 py-2">
        <Pressable onPress={() => setViewAll(v => !v)}>
          <Text className="text-xs text-foreground/50 underline">
            {viewAll
              ? t('thoughts.view_buckets')
              : t('thoughts.view_all_chats')}
          </Text>
        </Pressable>
      </View>

      {viewAll ? (
        <ThoughtsAllView
          messages={displayMessages}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          onFetchMore={fetchNextPage}
          onDelete={handleDelete}
          isSearching={isSearching}
        />
      ) : summariesLoading ? (
        <BucketCardSkeleton />
      ) : (
        <ScrollView
          contentContainerStyle={{
            gap: 8,
            paddingHorizontal: 20,
            paddingBottom: 16,
          }}
          showsVerticalScrollIndicator={false}
        >
          {(summaries ?? []).map(s => (
            <BucketCard
              key={s.bucket}
              bucket={s.bucket}
              latestText={s.latestText}
              latestCreatedAt={s.latestCreatedAt}
              unreadCount={s.unreadCount}
              onPress={() => handleBucketPress(s.bucket)}
            />
          ))}
        </ScrollView>
      )}

      {activeBucket && (
        <ThoughtsBucketChat
          bucket={activeBucket}
          messages={displayMessages}
          searchQuery={searchQuery}
          onBack={() => setActiveBucket(null)}
          onDelete={handleDelete}
        />
      )}
    </View>
  );
}
