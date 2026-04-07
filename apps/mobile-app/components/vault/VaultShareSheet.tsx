import { useCallback, useState } from 'react';
import { Modal, ScrollView } from 'react-native';
import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { Pressable } from '@/components/ui/pressable';
import { Button, ButtonText } from '@/components/ui/button';
import { useLocalization } from '@/context';
import { useShareToGroups } from '@/hooks/useShareToGroups';
import type { VaultItem } from '@kurate/types';
import { ShareTargetGrid } from '@/components/shared/ShareTargetGrid';

interface VaultShareSheetProps {
  open: boolean;
  item: VaultItem | null;
  onClose: () => void;
}

export function VaultShareSheet({ open, item, onClose }: VaultShareSheetProps) {
  const { t } = useLocalization();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const shareMutation = useShareToGroups();

  const handleSelectionChange = useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids));
  }, []);

  const handleShare = useCallback(async () => {
    if (!item || selectedIds.size === 0) return;
    await shareMutation.mutateAsync({
      loggedItemId: item.logged_item_id,
      conversationIds: Array.from(selectedIds),
    });
    setSelectedIds(new Set());
    onClose();
  }, [item, selectedIds, shareMutation, onClose]);

  const handleClose = useCallback(() => {
    setSelectedIds(new Set());
    onClose();
  }, [onClose]);

  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <Pressable className="flex-1 bg-black/20" onPress={handleClose} />
      <View className="rounded-t-2xl border-t border-border bg-background shadow-lg">
        <View className="mx-auto mt-3 h-1 w-8 rounded-full bg-muted-foreground/30" />
        <Text className="px-4 pb-2 pt-4 font-sans text-base font-bold text-foreground">
          {t('vault.share_modal_title')}
        </Text>
        <ScrollView style={{ maxHeight: 320 }}>
          <ShareTargetGrid
            selectedIds={selectedIds}
            onSelectionChange={handleSelectionChange}
            alreadySharedIds={new Set()}
            enabled={open}
          />
        </ScrollView>
        <View className="mx-4 mb-6 mt-2">
          <Button onPress={handleShare} disabled={selectedIds.size === 0}>
            <ButtonText>
              {t('vault.share_modal_share_selected')}
              {selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}
            </ButtonText>
          </Button>
        </View>
      </View>
    </Modal>
  );
}
