import { View } from '@/components/ui/view';
import { Skeleton } from '@/components/ui/skeleton';

export function VaultCardSkeleton() {
  return (
    <View className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <Skeleton className="h-[120px] w-full rounded-none" />
      <View className="gap-2 p-3">
        <Skeleton className="h-4 w-3/4 rounded" />
        <Skeleton className="h-4 w-full rounded" />
        <Skeleton className="h-3 w-2/3 rounded" />
      </View>
    </View>
  );
}
