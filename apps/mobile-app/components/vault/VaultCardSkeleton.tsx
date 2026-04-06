import { View } from '@/components/ui/view';
import { HStack } from '@/components/ui/hstack';

export function VaultCardSkeleton() {
  return (
    <View className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <View className="h-[150px] w-full bg-muted opacity-60" />
      <View className="gap-2 p-3">
        <View className="h-4 w-3/4 rounded bg-muted opacity-60" />
        <View className="h-4 w-full rounded bg-muted opacity-60" />
        <View className="h-3 w-2/3 rounded bg-muted opacity-60" />
      </View>
      <HStack className="gap-2 border-t border-border px-3 py-2">
        <View className="h-7 w-7 rounded-[10px] bg-muted opacity-60" />
        <View className="h-7 w-7 rounded-[10px] bg-muted opacity-60" />
      </HStack>
    </View>
  );
}
