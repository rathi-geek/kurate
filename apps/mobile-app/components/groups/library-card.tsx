import React, { useCallback } from 'react';
import { Pressable } from '@/components/ui/pressable';
import { View } from '@/components/ui/view';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Image, resizeMode } from '@/components/ui/fast-image';
import { useLocalization } from '@/context';
import type { GroupDrop } from '@kurate/types';
import { EngagementBar } from '@/components/groups/engagement-bar';

interface LibraryCardProps {
  drop: GroupDrop;
  currentUserId: string;
  /** Press handler — typically switches the group view to Feed (and ideally scrolls to the drop). */
  onPress?: (dropId: string) => void;
}

const metaOf = (raw: unknown): { source?: string; readTime?: string } => {
  if (!raw || typeof raw !== 'object') return {};
  const r = raw as Record<string, unknown>;
  return {
    source: typeof r.source === 'string' ? r.source : undefined,
    readTime: typeof r.read_time === 'string' ? r.read_time : undefined,
  };
};

export function LibraryCard({
  drop,
  currentUserId,
  onPress,
}: LibraryCardProps) {
  const { t } = useLocalization();
  const meta = metaOf(drop.item?.raw_metadata);

  const handlePress = useCallback(() => {
    onPress?.(drop.id);
  }, [drop.id, onPress]);

  const previewUrl = drop.item?.preview_image_url;
  const fallbackText = drop.item?.title ?? drop.content ?? drop.note ?? '';

  return (
    <Pressable
      onPress={handlePress}
      className="mx-4 my-2 gap-3 overflow-hidden rounded-xl border border-border bg-card shadow-sm active:opacity-80"
      accessibilityLabel={fallbackText || t('groups.drop_aria_fallback')}
    >
      {previewUrl ? (
        <View
          style={{ width: '100%', aspectRatio: 16 / 9 }}
          className="bg-accent"
        >
          <Image
            source={{ uri: previewUrl }}
            style={{ width: '100%', height: '100%' }}
            resizeMode={resizeMode.cover}
          />
        </View>
      ) : null}

      <VStack className="gap-2 p-3">
        {drop.item ? (
          <>
            <Text
              numberOfLines={2}
              className="font-sans text-sm font-medium text-foreground"
            >
              {drop.item.title ?? drop.item.url ?? ''}
            </Text>
            {meta.source || meta.readTime ? (
              <HStack className="items-center gap-1">
                {meta.source ? (
                  <Text className="font-mono text-[11px] text-muted-foreground">
                    {meta.source}
                  </Text>
                ) : null}
                {meta.source && meta.readTime ? (
                  <Text className="font-mono text-[11px] text-muted-foreground">
                    ·
                  </Text>
                ) : null}
                {meta.readTime ? (
                  <Text className="font-mono text-[11px] text-muted-foreground">
                    {meta.readTime}
                  </Text>
                ) : null}
              </HStack>
            ) : null}
          </>
        ) : drop.content || drop.note ? (
          <Text numberOfLines={3} className="font-sans text-sm text-foreground">
            {drop.content ?? drop.note}
          </Text>
        ) : null}

        <View className="border-t border-border/50 pt-2">
          <EngagementBar
            drop={drop}
            currentUserId={currentUserId}
            showComments={false}
          />
        </View>
      </VStack>
    </Pressable>
  );
}
