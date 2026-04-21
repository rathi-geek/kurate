import React, { useCallback, useEffect, useState } from 'react';
import { Linking } from 'react-native';
import FastImage from 'react-native-fast-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { Check, CheckCheck, Pencil, Share2, Trash2 } from 'lucide-react-native';
import type { VaultItem } from '@kurate/types';
import { decodeHtmlEntities } from '@kurate/utils';
import { lightTheme } from '@kurate/theme';
import { DomainFavicon } from '@/components/ui/domain-favicon';
import { useRefreshLoggedItem } from '@/hooks/useRefreshLoggedItem';

interface VaultCardProps {
  item: VaultItem;
  onToggleRead: (item: VaultItem) => void;
  onDelete: (id: string) => void;
  onShare?: (item: VaultItem) => void;
  onEditRemark?: (item: VaultItem) => void;
}

function VaultCardImage({
  uri,
  fallbackText,
  itemUrl,
}: {
  uri: string | null;
  fallbackText: string | null;
  itemUrl: string;
}) {
  const [imgError, setImgError] = useState(false);

  if (uri && !imgError) {
    return (
      <FastImage
        source={{ uri, priority: FastImage.priority.normal }}
        style={{ height: 120, width: '100%' }}
        resizeMode={FastImage.resizeMode.cover}
        onError={() => setImgError(true)}
      />
    );
  }

  if (fallbackText) {
    return (
      <View className="h-[120px] w-full items-center justify-center bg-muted px-4">
        <Text
          className="text-center text-xs text-muted-foreground"
          numberOfLines={4}
        >
          {fallbackText}
        </Text>
      </View>
    );
  }

  return (
    <View className="h-[120px] w-full items-center justify-center bg-muted">
      <DomainFavicon url={itemUrl} size={48} />
    </View>
  );
}

export const VaultCard = React.memo(function VaultCard({
  item,
  onToggleRead,
  onDelete,
  onShare,
  onEditRemark,
}: VaultCardProps) {
  useRefreshLoggedItem({
    id: item.id,
    url: item.url,
    title: item.title ?? null,
    preview_image_url: item.preview_image_url ?? null,
  });

  const [showActions, setShowActions] = useState(false);

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(12);
  useEffect(() => {
    opacity.value = withTiming(1, {
      duration: 350,
      easing: Easing.out(Easing.ease),
    });
    translateY.value = withTiming(0, {
      duration: 350,
      easing: Easing.out(Easing.ease),
    });
  }, [opacity, translateY]);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const handlePress = useCallback(() => {
    if (showActions) {
      setShowActions(false);
    } else {
      Linking.openURL(item.url);
    }
  }, [item.url, showActions]);

  const handleLongPress = useCallback(() => {
    setShowActions(true);
  }, []);

  const timeLabel = item.raw_metadata?.read_time ?? item.raw_metadata?.duration;
  const ReadIcon = item.is_read ? CheckCheck : Check;

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={handlePress}
        onLongPress={handleLongPress}
        className={`overflow-hidden rounded-xl border border-border bg-card shadow-sm ${item.is_read ? 'opacity-60' : ''}`}
      >
        <View>
          <VaultCardImage
            uri={item.preview_image_url}
            fallbackText={item.description}
            itemUrl={item.url}
          />
          {showActions && (
            <Pressable
              onPress={() => setShowActions(false)}
              className="absolute inset-0 z-10 flex-row items-center justify-center gap-2 rounded-t-xl bg-black/40"
            >
              <Pressable
                onPress={() => {
                  onToggleRead(item);
                  setShowActions(false);
                }}
                className="h-9 w-9 items-center justify-center rounded-full bg-white/20"
              >
                <ReadIcon size={16} color={lightTheme.brandWhite} />
              </Pressable>
              {onEditRemark && (
                <Pressable
                  onPress={() => {
                    onEditRemark(item);
                    setShowActions(false);
                  }}
                  className="h-9 w-9 items-center justify-center rounded-full bg-white/20"
                >
                  <Pencil size={16} color={lightTheme.brandWhite} />
                </Pressable>
              )}
              {onShare && (
                <Pressable
                  onPress={() => {
                    onShare(item);
                    setShowActions(false);
                  }}
                  className="h-9 w-9 items-center justify-center rounded-full bg-white/20"
                >
                  <Share2 size={16} color={lightTheme.brandWhite} />
                </Pressable>
              )}
              <Pressable
                onPress={() => {
                  onDelete(item.id);
                  setShowActions(false);
                }}
                className="h-9 w-9 items-center justify-center rounded-full bg-white/20"
              >
                <Trash2 size={16} color="#f87171" />
              </Pressable>
            </Pressable>
          )}
        </View>
        <View className="gap-1 p-3">
          <Text
            className="font-sans text-sm font-bold text-foreground"
            numberOfLines={2}
          >
            {decodeHtmlEntities(item.title) || item.url}
          </Text>
          {item.tags && item.tags.length > 0 && (
            <HStack className="mt-1 flex-wrap gap-1">
              {item.tags.map(tag => (
                <View
                  key={tag}
                  className="rounded-[6px] bg-accent px-1.5 py-0.5"
                >
                  <Text className="text-xs text-foreground">{tag}</Text>
                </View>
              ))}
            </HStack>
          )}
          {item.remarks?.trim() ? (
            <Text
              className="mt-1 text-sm text-muted-foreground"
              numberOfLines={2}
            >
              {item.remarks}
            </Text>
          ) : null}
          {item.description ? (
            <Text
              className="mt-1 text-xs text-muted-foreground"
              numberOfLines={2}
            >
              {item.description}
            </Text>
          ) : null}
          <Text className="mt-1.5 font-mono text-xs text-muted-foreground">
            {item.raw_metadata?.source ?? '—'}
            {timeLabel ? ` · ${timeLabel}` : ''}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
});
