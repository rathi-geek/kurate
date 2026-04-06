import { View } from '@/components/ui/view';
import { VStack } from '@/components/ui/vstack';

const ROWS = [1, 2, 3, 4];

export function BucketCardSkeleton() {
  return (
    <VStack className="gap-2 px-5">
      {ROWS.map(i => (
        <View key={i} className="rounded-xl bg-accent px-4 py-3">
          <View className="h-4 w-1/3 rounded bg-muted opacity-60" />
          <View className="mt-2 h-3 w-2/3 rounded bg-muted opacity-60" />
        </View>
      ))}
    </VStack>
  );
}
