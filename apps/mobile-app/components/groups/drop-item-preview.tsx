import React, { useCallback } from 'react';
import { Linking } from 'react-native';
import { Pressable } from '@/components/ui/pressable';
import { View } from '@/components/ui/view';
import { VStack } from '@/components/ui/vstack';
import { Text } from '@/components/ui/text';
import { Image, resizeMode } from '@/components/ui/fast-image';
import { DomainFavicon } from '@/components/ui/domain-favicon';
import type { GroupDrop } from '@kurate/types';
import { decodeHtmlEntities } from '@kurate/utils';

interface DropItemPreviewProps {
  item: NonNullable<GroupDrop['item']>;
}

const hostOf = (url: string): string => {
  try {
    return new URL(url).host.replace(/^www\./, '');
  } catch {
    return '';
  }
};

export function DropItemPreview({ item }: DropItemPreviewProps) {
  const url = item.url ?? '';
  const host = url ? hostOf(url) : '';

  const handlePress = useCallback(() => {
    if (url) void Linking.openURL(url);
  }, [url]);

  return (
    <Pressable
      onPress={handlePress}
      disabled={!url}
      className="active:opacity-80"
    >
      {item.preview_image_url ? (
        <View style={{ width: '100%', height: 140 }} className="bg-accent">
          <Image
            source={{ uri: item.preview_image_url }}
            style={{ width: '100%', height: '100%' }}
            resizeMode={resizeMode.cover}
          />
        </View>
      ) : url ? (
        <View
          style={{ width: '100%', height: 140 }}
          className="items-center justify-center bg-accent/40"
        >
          <DomainFavicon url={url} size={56} />
        </View>
      ) : null}
      <VStack className="gap-1 p-3">
        {item.title ? (
          <Text
            numberOfLines={2}
            className="font-sans text-sm font-medium text-foreground"
          >
            {decodeHtmlEntities(item.title)}
          </Text>
        ) : null}
        {host ? (
          <Text className="font-mono text-xs text-muted-foreground">
            {host}
          </Text>
        ) : null}
      </VStack>
    </Pressable>
  );
}
