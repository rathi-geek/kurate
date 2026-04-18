import React from 'react';
import { View, Text } from 'react-native';
import { Image } from '@/components/ui/fast-image';
import { cn } from '@/lib/utils';

type IAvatarProps = {
  uri?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
};

const initialsOf = (name?: string | null): string => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const second = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + second).toUpperCase() || '?';
};

const Avatar = React.forwardRef<React.ComponentRef<typeof View>, IAvatarProps>(
  function Avatar({ uri, name, size = 40, className }, ref) {
    const [errored, setErrored] = React.useState(false);
    const dims = { width: size, height: size, borderRadius: size / 2 };
    const showImage = !!uri && !errored;

    return (
      <View
        ref={ref}
        style={dims}
        className={cn(
          'items-center justify-center overflow-hidden bg-primary',
          className,
        )}
      >
        {showImage ? (
          <Image
            source={{ uri: uri! }}
            style={dims}
            onError={() => setErrored(true)}
          />
        ) : (
          <Text
            className="font-sans font-semibold text-white"
            style={{ fontSize: Math.max(10, size * 0.38) }}
          >
            {initialsOf(name)}
          </Text>
        )}
      </View>
    );
  },
);

Avatar.displayName = 'Avatar';

export { Avatar };
