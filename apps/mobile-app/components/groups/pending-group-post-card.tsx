import React from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { View } from '@/components/ui/view';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Pressable } from '@/components/ui/pressable';
import { decodeHtmlEntities } from '@kurate/utils';
import { Spinner } from '@/components/ui/spinner';
import { Image, resizeMode } from '@/components/ui/fast-image';
import { DomainFavicon } from '@/components/ui/domain-favicon';
import { useLocalization } from '@/context';
import type { PendingGroupPostRow } from '@kurate/hooks';

interface PendingGroupPostCardProps {
  row: PendingGroupPostRow;
  onRetry?: (tempId: string) => void;
  onDismiss?: (tempId: string) => void;
}

const OPACITY_BY_STATUS = {
  sending: 0.7,
  confirmed: 1,
  failed: 0.6,
} as const;

const hostOf = (url: string): string => {
  try {
    return new URL(url).host.replace(/^www\./, '');
  } catch {
    return '';
  }
};

export function PendingGroupPostCard({
  row,
  onRetry,
  onDismiss,
}: PendingGroupPostCardProps) {
  const { t } = useLocalization();

  const isSending = row.status === 'sending';
  const isConfirmed = row.status === 'confirmed';
  const isFailed = row.status === 'failed';

  // Pulsing opacity for sending badge
  const pulseOpacity = useSharedValue(1);
  useEffect(() => {
    if (isSending) {
      pulseOpacity.value = withRepeat(
        withTiming(0.4, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    } else {
      pulseOpacity.value = 1;
    }
  }, [isSending, pulseOpacity]);
  const pulseStyle = useAnimatedStyle(() => ({ opacity: pulseOpacity.value }));

  // Fade-out for confirmed badge
  const confirmOpacity = useSharedValue(1);
  useEffect(() => {
    if (isConfirmed) {
      confirmOpacity.value = withDelay(500, withTiming(0, { duration: 1000 }));
    }
  }, [isConfirmed, confirmOpacity]);
  const confirmStyle = useAnimatedStyle(() => ({
    opacity: confirmOpacity.value,
  }));

  const statusText = isSending
    ? t('groups.posting')
    : isConfirmed
      ? t('groups.posted')
      : t('groups.failed_to_post');

  return (
    <View style={{ opacity: OPACITY_BY_STATUS[row.status] }}>
      {/* Header */}
      <HStack className="items-center gap-2 py-2">
        <View className="h-8 w-8 items-center justify-center rounded-full bg-primary">
          <Text className="font-sans text-xs font-bold text-primary-foreground">
            YOU
          </Text>
        </View>
        <HStack className="items-center gap-1.5">
          <Text className="font-sans text-xs font-semibold text-foreground">
            YOU
          </Text>
          <Text className="font-sans text-xs text-muted-foreground">
            {statusText}
          </Text>
        </HStack>
      </HStack>

      {/* Card body */}
      <View className="relative overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {/* Sending badge */}
        {isSending ? (
          <Animated.View
            style={[
              pulseStyle,
              {
                position: 'absolute',
                top: 8,
                right: 8,
                zIndex: 20,
              },
            ]}
          >
            <HStack className="items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5">
              <Spinner size="small" />
              <Text className="font-sans text-[10px] font-medium text-muted-foreground">
                {t('groups.posting')}
              </Text>
            </HStack>
          </Animated.View>
        ) : null}

        {/* Confirmed badge */}
        {isConfirmed ? (
          <Animated.View
            style={[
              confirmStyle,
              {
                position: 'absolute',
                top: 8,
                right: 8,
                zIndex: 20,
              },
            ]}
          >
            <HStack className="items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5">
              <Text className="font-sans text-[10px] font-medium text-foreground">
                ✓ {t('groups.posted')}
              </Text>
            </HStack>
          </Animated.View>
        ) : null}

        {/* Content */}
        <View className="gap-3">
          {/* Note */}
          {row.note ? (
            <Text className="px-3 pt-2 font-sans text-xs italic text-muted-foreground">
              {row.note}
            </Text>
          ) : null}

          {/* Link post: preview image (or domain favicon) + title + source */}
          {row.url ? (
            <VStack className="gap-2">
              {row.previewImage ? (
                <View
                  style={{ height: 180 }}
                  className="overflow-hidden bg-accent"
                >
                  <Image
                    source={{ uri: row.previewImage }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode={resizeMode.cover}
                  />
                </View>
              ) : (
                <View
                  style={{ height: 180 }}
                  className="items-center justify-center bg-accent/40"
                >
                  <DomainFavicon url={row.url} size={56} />
                </View>
              )}
              <VStack className="gap-1 px-3 pb-3">
                <Text
                  numberOfLines={2}
                  className="font-sans text-sm font-bold text-foreground"
                >
                  {decodeHtmlEntities(row.title) ?? row.url}
                </Text>
                <Text className="font-mono text-[11px] text-muted-foreground">
                  {row.source ?? hostOf(row.url)}
                </Text>
              </VStack>
            </VStack>
          ) : null}

          {/* Text-only post */}
          {!row.url && row.content ? (
            <View className="rounded-xl bg-secondary p-3">
              <Text className="font-sans text-sm text-foreground">
                {row.content}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Failed footer */}
        {isFailed ? (
          <HStack className="items-center justify-between border-t border-destructive/30 bg-destructive/10 px-3 py-2">
            <Text className="font-sans text-xs font-medium text-destructive">
              {t('groups.failed_to_post')}
            </Text>
            <HStack className="items-center gap-2">
              {onRetry ? (
                <Pressable
                  onPress={() => onRetry(row.tempId)}
                  className="rounded-lg px-2 py-1 active:bg-destructive/20"
                >
                  <Text className="font-sans text-xs font-medium text-destructive">
                    {t('groups.retry')}
                  </Text>
                </Pressable>
              ) : null}
              {onDismiss ? (
                <Pressable
                  onPress={() => onDismiss(row.tempId)}
                  className="rounded-lg px-2 py-1 active:bg-destructive/20"
                >
                  <Text className="font-sans text-xs font-medium text-destructive">
                    {t('groups.dismiss')}
                  </Text>
                </Pressable>
              ) : null}
            </HStack>
          </HStack>
        ) : null}
      </View>
    </View>
  );
}
