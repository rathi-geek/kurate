import { useState } from 'react';
import { Image } from 'react-native';
import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Link2 } from 'lucide-react-native';
import { useLocalization } from '@/context';
import type { ExtractedMeta } from '@kurate/types';

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
      <HStack className="items-center gap-3 p-4">
        <Link2 size={20} className="text-muted-foreground" />
        <VStack className="gap-1">
          <Text className="font-mono text-xs text-muted-foreground">
            {domain}
          </Text>
          <Text className="text-sm text-foreground">
            {t('link_preview.reading')}
          </Text>
        </VStack>
      </HStack>
    );
  }

  if (extractionFailed || !metadata) {
    return (
      <HStack className="items-center gap-3 p-4">
        <Link2 size={20} className="text-muted-foreground" />
        <VStack className="gap-1">
          <Text className="font-mono text-xs text-muted-foreground">
            {domain}
          </Text>
        </VStack>
      </HStack>
    );
  }

  const metaLine = [metadata.source, metadata.contentType, metadata.readTime]
    .filter(Boolean)
    .join(' · ');

  return (
    <HStack className="items-start gap-3 p-4">
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
          {metadata.title ?? domain}
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
    </HStack>
  );
}
