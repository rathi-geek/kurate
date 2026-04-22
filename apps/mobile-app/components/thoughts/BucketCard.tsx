import { Text } from '@/components/ui/text';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { View } from '@/components/ui/view';
import { Pressable } from '@/components/ui/pressable';
import { ChevronRight, Pin } from 'lucide-react-native';
import { getBucketBadgeColor } from '@kurate/utils';

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
  slug: string;
  label: string;
  color: string;
  isPinned: boolean;
  isSystem: boolean;
  latestText: string | null;
  latestCreatedAt: string | null;
  unreadCount: number;
  onPress: () => void;
  onLongPress?: () => void;
}

export function BucketCard({
  label,
  color,
  isPinned,
  isSystem,
  latestText,
  latestCreatedAt,
  unreadCount,
  onPress,
  onLongPress,
}: BucketCardProps) {
  return (
    <Pressable
      onPress={onPress}
      onLongPress={!isSystem ? onLongPress : undefined}
      className="rounded-xl px-4 py-3"
      style={{ backgroundColor: color }}
    >
      <HStack className="items-center">
        <VStack className="mr-auto flex-1 gap-0.5">
          <HStack className="items-center gap-1">
            <Text className="font-sans text-sm font-semibold text-foreground">
              {label}
            </Text>
            {isPinned && <Pin size={10} className="text-foreground/40" />}
          </HStack>
          {latestText && (
            <Text className="text-xs text-foreground/45" numberOfLines={1}>
              {latestText}
            </Text>
          )}
        </VStack>
        <VStack className="items-end gap-1">
          {latestCreatedAt && (
            <Text className="text-[10px] text-foreground/30">
              {formatRelativeTime(latestCreatedAt)}
            </Text>
          )}
          <HStack className="items-center gap-1">
            {unreadCount > 0 && (
              <View
                className="rounded-full px-1.5 py-0.5"
                style={{ backgroundColor: getBucketBadgeColor(color) }}
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
