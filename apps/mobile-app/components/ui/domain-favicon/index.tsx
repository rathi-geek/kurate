import React from 'react';
import { View } from '@/components/ui/view';
import { Image, resizeMode } from '@/components/ui/fast-image';
import { Icon } from '@/components/ui/icon';
import { Link2 } from 'lucide-react-native';

interface DomainFaviconProps {
  url: string;
  size?: number;
}

function getHostname(url: string): string | null {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return null;
  }
}

export function DomainFavicon({ url, size = 48 }: DomainFaviconProps) {
  const hostname = getHostname(url);

  if (!hostname) {
    return (
      <View
        style={{ width: size, height: size }}
        className="items-center justify-center rounded-md bg-accent"
      >
        <Icon as={Link2} size="xs" className="text-muted-foreground" />
      </View>
    );
  }

  return (
    <View
      style={{ width: size, height: size }}
      className="items-center justify-center overflow-hidden rounded-md bg-accent"
    >
      <Image
        source={{
          uri: `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`,
        }}
        style={{ width: size * 0.6, height: size * 0.6 }}
        resizeMode={resizeMode.contain}
      />
    </View>
  );
}
