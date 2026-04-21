import React, { useCallback, useEffect, useRef, useState } from 'react';
import { TextInput } from 'react-native';
import {
  BottomSheet,
  BottomSheetView,
  type BottomSheetHandle,
} from '@/components/ui/bottom-sheet';
import { View } from '@/components/ui/view';
import { VStack } from '@/components/ui/vstack';
import { Text } from '@/components/ui/text';
import { Pressable } from '@/components/ui/pressable';
import { Spinner } from '@/components/ui/spinner';
import { useLocalization } from '@/context';
import { MAX_BUCKET_NAME_LENGTH } from '@kurate/utils';
import type { Bucket } from '@kurate/types';

interface CreateBucketSheetProps {
  open: boolean;
  onClose: () => void;
  onCreateBucket: (label: string) => Promise<Bucket>;
  isCreating: boolean;
  error?: string | null;
}

export function CreateBucketSheet({
  open,
  onClose,
  onCreateBucket,
  isCreating,
  error,
}: CreateBucketSheetProps) {
  const { t } = useLocalization();
  const sheetRef = useRef<BottomSheetHandle>(null);
  const [name, setName] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      sheetRef.current?.present();
      setName('');
      setLocalError(null);
    } else {
      sheetRef.current?.dismiss();
    }
  }, [open]);

  const handleCreate = useCallback(async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setLocalError(t('thoughts.bucket_name_required'));
      return;
    }
    if (trimmed.length > MAX_BUCKET_NAME_LENGTH) {
      setLocalError(t('thoughts.bucket_name_too_long'));
      return;
    }
    setLocalError(null);
    try {
      await onCreateBucket(trimmed);
      onClose();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      if (msg === 'BUCKET_NAME_DUPLICATE') {
        setLocalError(t('thoughts.bucket_name_duplicate'));
      } else if (msg === 'MAX_BUCKETS_REACHED') {
        setLocalError(t('thoughts.max_buckets_reached'));
      } else {
        setLocalError(msg);
      }
    }
  }, [name, onCreateBucket, onClose, t]);

  const displayError = localError ?? error;

  return (
    <BottomSheet ref={sheetRef} onDismiss={onClose}>
      <BottomSheetView>
        <VStack className="gap-4 px-4 pb-8 pt-2">
          <Text className="font-sans text-base font-semibold text-foreground">
            {t('thoughts.create_bucket')}
          </Text>

          <View className="rounded-xl border border-border bg-card px-3 py-2.5">
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={t('thoughts.new_bucket_placeholder')}
              maxLength={MAX_BUCKET_NAME_LENGTH}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={() => void handleCreate()}
              style={{ fontSize: 14, color: '#2b5b7e', fontFamily: 'DMSans' }}
              placeholderTextColor="#5b7d99"
            />
          </View>

          {displayError && (
            <Text className="text-xs text-destructive">{displayError}</Text>
          )}

          <Text className="text-right text-xs text-muted-foreground">
            {name.length}/{MAX_BUCKET_NAME_LENGTH}
          </Text>

          <Pressable
            onPress={() => void handleCreate()}
            disabled={isCreating || !name.trim()}
            className="items-center rounded-xl bg-primary py-3"
            style={{ opacity: isCreating || !name.trim() ? 0.5 : 1 }}
          >
            {isCreating ? (
              <Spinner className="text-primary-foreground" />
            ) : (
              <Text className="font-sans text-sm font-semibold text-primary-foreground">
                {t('thoughts.create_bucket')}
              </Text>
            )}
          </Pressable>
        </VStack>
      </BottomSheetView>
    </BottomSheet>
  );
}
