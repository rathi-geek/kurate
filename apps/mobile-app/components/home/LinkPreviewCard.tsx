import { useCallback, useState } from 'react';
import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { Button, ButtonText } from '@/components/ui/button';
import { X } from 'lucide-react-native';
import { useLocalization } from '@/context';
import { PreviewPhase } from '@kurate/types';
import type { ExtractedMeta } from '@kurate/types';
import { UrlExtractPreview } from '@/components/shared/UrlExtractPreview';
import { ShareTargetGrid } from '@/components/shared/ShareTargetGrid';

interface LinkPreviewCardProps {
  phase: Exclude<PreviewPhase, PreviewPhase.Idle>;
  url: string;
  metadata?: ExtractedMeta | null;
  extractionFailed?: boolean;
  savedItemGroups?: string[];
  onClose: () => void;
  onShare: (groupIds: string[]) => void;
  onSkip: () => void;
}

export function LinkPreviewCard({
  phase,
  url,
  metadata,
  extractionFailed,
  savedItemGroups,
  onClose,
  onShare,
  onSkip,
}: LinkPreviewCardProps) {
  const { t } = useLocalization();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const alreadySharedIds = new Set(savedItemGroups ?? []);

  const handleSelectionChange = useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids));
  }, []);

  return (
    <View className="mx-4 mb-2 overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
      {phase === PreviewPhase.Loading && (
        <UrlExtractPreview url={url} isLoading metadata={null} />
      )}

      {phase === PreviewPhase.Loaded && (
        <View>
          <UrlExtractPreview
            url={url}
            isLoading={false}
            metadata={metadata}
            extractionFailed={extractionFailed}
          />
          <Pressable
            onPress={onClose}
            className="absolute right-3 top-3 rounded-full bg-muted p-1"
          >
            <X size={14} className="text-muted-foreground" />
          </Pressable>
        </View>
      )}

      {phase === PreviewPhase.Share && (
        <View>
          <View className="px-4 pb-2 pt-4">
            <Text className="text-sm font-semibold text-primary">
              {t('link_preview.saved_heading')}
            </Text>
            <Text className="mt-0.5 text-sm text-muted-foreground">
              {t('link_preview.share_prompt')}
            </Text>
          </View>
          <View className="border-t border-border py-2">
            <ShareTargetGrid
              selectedIds={selectedIds}
              onSelectionChange={handleSelectionChange}
              alreadySharedIds={alreadySharedIds}
              enabled
            />
          </View>
          <HStack className="items-center justify-between border-t border-border px-4 py-3">
            <Pressable onPress={onSkip}>
              <Text className="text-sm text-muted-foreground">
                {t('link_preview.skip')}
              </Text>
            </Pressable>
            {selectedIds.size > 0 && (
              <Button
                size="sm"
                onPress={() => onShare(Array.from(selectedIds))}
              >
                <ButtonText>{t('link_preview.share_btn_send')}</ButtonText>
              </Button>
            )}
          </HStack>
        </View>
      )}
    </View>
  );
}
