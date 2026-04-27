import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import Toast from 'react-native-toast-message';
import {
  BottomSheet,
  BottomSheetView,
  type BottomSheetHandle,
} from '@/components/ui/bottom-sheet';
import { View } from '@/components/ui/view';
import { VStack } from '@/components/ui/vstack';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { ShareTargetGrid } from '@/components/shared/ShareTargetGrid';
import { useLocalization } from '@/context';
import { supabase } from '@/libs/supabase/client';
import { useAuthStore } from '@/store';
import { useShareToGroups } from '@kurate/hooks';

interface DropShareSheetProps {
  open: boolean;
  loggedItemId: string | null;
  excludeGroupId?: string;
  onClose: () => void;
}

export function DropShareSheet({
  open,
  loggedItemId,
  excludeGroupId,
  onClose,
}: DropShareSheetProps) {
  const { t } = useLocalization();
  const userId = useAuthStore(state => state.userId) ?? '';
  const sheetRef = useRef<BottomSheetHandle>(null);
  const snapPoints = useMemo(() => ['65%'], []);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const shareMutation = useShareToGroups(supabase, () => {
    Toast.show({ type: 'success', text1: t('groups.toast_shared') });
  });

  useEffect(() => {
    if (open) sheetRef.current?.present();
    else sheetRef.current?.dismiss();
  }, [open]);

  const handleSelectionChange = useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids));
  }, []);

  const handleShare = useCallback(async () => {
    if (!loggedItemId || selectedIds.size === 0) return;
    await shareMutation.mutateAsync({
      loggedItemId,
      groupIds: Array.from(selectedIds),
      userId,
    });
    setSelectedIds(new Set());
    onClose();
  }, [loggedItemId, selectedIds, userId, shareMutation, onClose]);

  const handleDismiss = useCallback(() => {
    setSelectedIds(new Set());
    onClose();
  }, [onClose]);

  const alreadySharedIds = useMemo(
    () => (excludeGroupId ? new Set([excludeGroupId]) : new Set<string>()),
    [excludeGroupId],
  );

  return (
    <BottomSheet
      ref={sheetRef}
      snapPoints={snapPoints}
      enableDynamicSizing={false}
      onDismiss={handleDismiss}
    >
      <BottomSheetView>
        <VStack className=" gap-3  pb-8 pt-2">
          <Text className=" mx-3 font-sans   text-lg font-semibold text-foreground">
            {t('vault.share_modal_title')}
          </Text>
          <ShareTargetGrid
            selectedIds={selectedIds}
            onSelectionChange={handleSelectionChange}
            alreadySharedIds={alreadySharedIds}
            enabled={open}
          />
          <Button
            onPress={handleShare}
            disabled={selectedIds.size === 0 || shareMutation.isPending}
            className="mx-3"
          >
            <ButtonText>
              {t('vault.share_modal_share_selected')}
              {selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}
            </ButtonText>
          </Button>
        </VStack>
      </BottomSheetView>
    </BottomSheet>
  );
}
