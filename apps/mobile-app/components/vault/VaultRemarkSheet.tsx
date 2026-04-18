import React, { useCallback, useEffect, useRef, useState } from 'react';
import { TextInput } from 'react-native';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { BottomSheet, BottomSheetView } from '@/components/ui/bottom-sheet';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Pressable } from '@/components/ui/pressable';
import { useLocalization } from '@/context';
import { lightTheme } from '@kurate/theme';
import type { VaultItem } from '@kurate/types';
import { decodeHtmlEntities } from '@kurate/utils';

interface VaultRemarkSheetProps {
  item: VaultItem | null;
  onSave: (id: string, remarks: string) => void;
  onClose: () => void;
}

export function VaultRemarkSheet({
  item,
  onSave,
  onClose,
}: VaultRemarkSheetProps) {
  const { t } = useLocalization();
  const sheetRef = useRef<BottomSheetModal>(null);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    if (item) {
      setDraft(item.remarks ?? '');
      sheetRef.current?.present();
    } else {
      sheetRef.current?.dismiss();
    }
  }, [item]);

  const handleSave = useCallback(() => {
    if (!item) return;
    onSave(item.id, draft);
    onClose();
  }, [item, draft, onSave, onClose]);

  return (
    <BottomSheet ref={sheetRef} onDismiss={onClose}>
      <BottomSheetView>
        <VStack className="gap-4 px-4 pb-8 pt-2">
          <VStack className="gap-1">
            <Text className="font-sans text-base font-semibold text-foreground">
              {t('vault.remark_modal_title')}
            </Text>
            {item ? (
              <Text
                numberOfLines={2}
                className="font-sans text-sm text-muted-foreground"
              >
                {decodeHtmlEntities(item.title) || item.url}
              </Text>
            ) : null}
          </VStack>

          <TextInput
            className="min-h-[100px] rounded-xl border border-border bg-card px-3 py-2 font-sans text-sm text-foreground"
            placeholder={t('vault.remark_placeholder')}
            placeholderTextColor={lightTheme.brandMutedForeground}
            value={draft}
            onChangeText={setDraft}
            multiline
            textAlignVertical="top"
            autoFocus
          />

          <HStack className="justify-end gap-3">
            <Pressable
              onPress={onClose}
              className="rounded-[10px] border border-border px-4 py-2"
            >
              <Text className="font-sans text-sm font-medium text-foreground">
                {t('common.cancel')}
              </Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              className="rounded-[10px] bg-primary px-4 py-2"
            >
              <Text className="font-sans text-sm font-medium text-primary-foreground">
                {t('vault.save')}
              </Text>
            </Pressable>
          </HStack>
        </VStack>
      </BottomSheetView>
    </BottomSheet>
  );
}
