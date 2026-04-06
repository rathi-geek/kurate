import React, { useCallback, useState } from 'react';
import { Image, Linking } from 'react-native';
import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { Check, CheckCheck, Trash2, Link2 } from 'lucide-react-native';
import type { VaultItem } from '@kurate/types';

interface VaultCardProps {
  item: VaultItem;
  onToggleRead: (item: VaultItem) => void;
  onDelete: (id: string) => void;
}

function VaultCardImage({
  uri,
  fallbackText,
}: {
  uri: string | null;
  fallbackText: string | null;
}) {
  const [imgError, setImgError] = useState(false);

  if (uri && !imgError) {
    return (
      <Image
        source={{ uri }}
        className="h-[120px] w-full"
        resizeMode="cover"
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
      <Link2 size={32} className="text-muted-foreground" />
    </View>
  );
}

export const VaultCard = React.memo(function VaultCard({
  item,
  onToggleRead,
  onDelete,
}: VaultCardProps) {
  const [showActions, setShowActions] = useState(false);

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
    <Pressable
      onPress={handlePress}
      onLongPress={handleLongPress}
      className={`overflow-hidden rounded-xl border border-border bg-card shadow-sm ${item.is_read ? 'opacity-60' : ''}`}
    >
      <View>
        <VaultCardImage
          uri={item.preview_image_url}
          fallbackText={item.description}
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
              <ReadIcon size={16} color="white" />
            </Pressable>
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
          {item.title || item.url}
        </Text>
        {item.tags && item.tags.length > 0 && (
          <HStack className="mt-1 flex-wrap gap-1">
            {item.tags.map(tag => (
              <View key={tag} className="rounded-[6px] bg-accent px-1.5 py-0.5">
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
  );
});
