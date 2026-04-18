import { useEffect, useState } from 'react';
import { Image } from 'react-native';
import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { Link2 } from 'lucide-react-native';
import { useLocalization } from '@/context';
import type { ExtractedMeta } from '@kurate/types';
import { decodeHtmlEntities } from '@kurate/utils';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

interface UrlExtractPreviewProps {
  url: string;
  isLoading: boolean;
  metadata?: ExtractedMeta | null;
  extractionFailed?: boolean;
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

function PulsingText({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.4, { duration: 800 }),
        withTiming(1, { duration: 800 }),
      ),
      -1,
      true,
    );
  }, [opacity]);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.Text style={animStyle} className={className}>
      {children}
    </Animated.Text>
  );
}

export function UrlExtractPreview({
  url,
  isLoading,
  metadata,
  extractionFailed,
}: UrlExtractPreviewProps) {
  const { t } = useLocalization();
  const [imgError, setImgError] = useState(false);
  const domain = getDomain(url);

  if (isLoading) {
    return (
      <View className="flex-row items-center gap-3 p-4">
        <Link2 size={20} className="text-muted-foreground" />
        <VStack className="gap-1">
          <PulsingText className="font-sans text-sm font-medium text-foreground">
            {t('link_preview.reading')}
          </PulsingText>
          <PulsingText className="font-sans text-xs text-muted-foreground">
            {t('link_preview.extracting')}
          </PulsingText>
          <Text className="font-mono text-[10px] text-muted-foreground/50">
            {domain}
          </Text>
        </VStack>
      </View>
    );
  }

  if (extractionFailed || !metadata) {
    return (
      <View className="flex-row items-center gap-3 p-4">
        <Link2 size={20} className="text-muted-foreground" />
        <VStack className="gap-1">
          <Text className="font-mono text-xs text-muted-foreground">
            {domain}
          </Text>
        </VStack>
      </View>
    );
  }

  const metaLine = [metadata.source, metadata.contentType, metadata.readTime]
    .filter(Boolean)
    .join(' · ');

  return (
    <View className="flex-row items-start gap-3 p-4">
      {metadata.previewImage && !imgError ? (
        <Image
          source={{ uri: metadata.previewImage }}
          className="h-14 w-14 rounded-lg"
          resizeMode="cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <View className="h-14 w-14 items-center justify-center rounded-lg bg-muted">
          <Link2 size={20} className="text-muted-foreground" />
        </View>
      )}
      <VStack className="flex-1 gap-0.5">
        <Text className="text-sm font-medium text-foreground" numberOfLines={2}>
          {decodeHtmlEntities(metadata.title) ?? domain}
        </Text>
        {metadata.description ? (
          <Text className="text-xs text-muted-foreground" numberOfLines={2}>
            {metadata.description}
          </Text>
        ) : null}
        {metaLine ? (
          <Text className="font-mono text-xs text-muted-foreground">
            {metaLine}
          </Text>
        ) : null}
      </VStack>
    </View>
  );
}
