import { Text } from '@/components/ui/text';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { View } from '@/components/ui/view';
import { Pressable } from '@/components/ui/pressable';
import { ChevronRight } from 'lucide-react-native';
import { BUCKET_META, BUCKET_BADGE_COLOR } from '@kurate/utils';
import type { ThoughtBucket } from '@kurate/utils';
import { getBucketColors, lightTheme } from '@kurate/theme';

const BUCKET_COLORS = getBucketColors(lightTheme) as Record<
  ThoughtBucket,
  string
>;

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

interface BucketCardProps {
  bucket: ThoughtBucket;
  latestText: string | null;
  latestCreatedAt: string | null;
  unreadCount: number;
  onPress: () => void;
}

export function BucketCard({
  bucket,
  latestText,
  latestCreatedAt,
  unreadCount,
  onPress,
}: BucketCardProps) {
  const meta = BUCKET_META[bucket];

  return (
    <Pressable
      onPress={onPress}
      className="rounded-xl px-4 py-3"
      style={{ backgroundColor: BUCKET_COLORS[bucket] }}
    >
      <HStack className="items-center">
        <VStack className="mr-auto flex-1 gap-0.5">
          <Text className="font-sans text-sm font-semibold text-foreground">
            {meta.label}
          </Text>
          {latestText && (
            <Text className="text-xs text-foreground/45" numberOfLines={1}>
              {latestText}
            </Text>
          )}
        </VStack>
        <VStack className="items-end gap-1">
          <Text className="text-[10px] text-foreground/30">
            {formatRelativeTime(latestCreatedAt)}
          </Text>
          <HStack className="items-center gap-1">
            {unreadCount > 0 && (
              <View
                className="rounded-full px-1.5 py-0.5"
                style={{ backgroundColor: BUCKET_BADGE_COLOR[bucket] }}
              >
                <Text className="text-[9px] font-bold text-white">
                  {unreadCount}
                </Text>
              </View>
            )}
            <ChevronRight size={16} className=" text-foreground/30" />
          </HStack>
        </VStack>
      </HStack>
    </Pressable>
  );
}
