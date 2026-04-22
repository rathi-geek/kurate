import React, { useCallback, useEffect, useRef, useState } from 'react';
import { TextInput } from 'react-native';
import Toast from 'react-native-toast-message';
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
import { Icon } from '@/components/ui/icon';
import { PenLine, Trash2, Pin, PinOff } from 'lucide-react-native';
import { useLocalization } from '@/context';
import { MAX_BUCKET_NAME_LENGTH } from '@kurate/utils';
import type { BucketSummary } from '@kurate/hooks';

interface BucketOptionsSheetProps {
  open: boolean;
  bucket: BucketSummary | null;
  onClose: () => void;
  onRename: (bucketId: string, newLabel: string) => Promise<void>;
  onDelete: (bucketId: string) => Promise<void>;
  onTogglePin: (bucketId: string, pinned: boolean) => Promise<void>;
  /** The bucket row id from the buckets table */
  bucketId: string | null;
}

export function BucketOptionsSheet({
  open,
  bucket,
  onClose,
  onRename,
  onDelete,
  onTogglePin,
  bucketId,
}: BucketOptionsSheetProps) {
  const { t } = useLocalization();
  const sheetRef = useRef<BottomSheetHandle>(null);
  const [mode, setMode] = useState<'options' | 'rename'>('options');
  const [renameText, setRenameText] = useState('');
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      sheetRef.current?.present();
      setMode('options');
      setRenameText(bucket?.bucketLabel ?? '');
    } else {
      sheetRef.current?.dismiss();
    }
  }, [open, bucket?.bucketLabel]);

  const handleRename = useCallback(async () => {
    if (!bucketId || !renameText.trim()) return;
    setLoading('rename');
    try {
      await onRename(bucketId, renameText.trim());
      onClose();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error';
      Toast.show({ type: 'error', text1: msg });
    }
    setLoading(null);
  }, [bucketId, renameText, onRename, onClose]);

  const handleDelete = useCallback(async () => {
    if (!bucketId) return;
    setLoading('delete');
    try {
      await onDelete(bucketId);
      onClose();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error';
      Toast.show({ type: 'error', text1: msg });
    }
    setLoading(null);
  }, [bucketId, onDelete, onClose]);

  const handleTogglePin = useCallback(async () => {
    if (!bucketId || !bucket) return;
    setLoading('pin');
    try {
      await onTogglePin(bucketId, !bucket.isPinned);
      onClose();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error';
      Toast.show({ type: 'error', text1: msg });
    }
    setLoading(null);
  }, [bucketId, bucket, onTogglePin, onClose]);

  if (!bucket) return null;

  return (
    <BottomSheet ref={sheetRef} onDismiss={onClose}>
      <BottomSheetView>
        <VStack className="gap-2 px-4 pb-8 pt-2">
          <Text className="font-sans text-base font-semibold text-foreground">
            {t('thoughts.bucket_options')}
          </Text>

          {mode === 'rename' ? (
            <VStack className="gap-3">
              <View className="rounded-xl border border-border bg-card px-3 py-2.5">
                <TextInput
                  value={renameText}
                  onChangeText={setRenameText}
                  maxLength={MAX_BUCKET_NAME_LENGTH}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={() => void handleRename()}
                  style={{
                    fontSize: 14,
                    color: '#2b5b7e',
                    fontFamily: 'DMSans',
                  }}
                />
              </View>
              <Pressable
                onPress={() => void handleRename()}
                disabled={loading === 'rename' || !renameText.trim()}
                className="items-center rounded-xl bg-primary py-3"
                style={{
                  opacity: loading === 'rename' || !renameText.trim() ? 0.5 : 1,
                }}
              >
                {loading === 'rename' ? (
                  <Spinner className="text-primary-foreground" />
                ) : (
                  <Text className="font-sans text-sm font-semibold text-primary-foreground">
                    {t('thoughts.rename_bucket')}
                  </Text>
                )}
              </Pressable>
            </VStack>
          ) : (
            <>
              {/* Pin / Unpin */}
              <Pressable
                onPress={() => void handleTogglePin()}
                disabled={loading !== null}
                className="flex-row items-center gap-3 rounded-xl border border-border px-4 py-3 active:bg-accent/40"
              >
                <View className="h-8 w-8 items-center justify-center rounded-full bg-accent">
                  {loading === 'pin' ? (
                    <Spinner className="text-primary" />
                  ) : (
                    <Icon
                      as={bucket.isPinned ? PinOff : Pin}
                      size="xs"
                      className="text-primary"
                    />
                  )}
                </View>
                <Text className="font-sans text-sm font-medium text-foreground">
                  {bucket.isPinned
                    ? t('thoughts.unpin_bucket')
                    : t('thoughts.pin_bucket')}
                </Text>
              </Pressable>

              {/* Rename */}
              <Pressable
                onPress={() => setMode('rename')}
                disabled={loading !== null}
                className="flex-row items-center gap-3 rounded-xl border border-border px-4 py-3 active:bg-accent/40"
              >
                <View className="h-8 w-8 items-center justify-center rounded-full bg-accent">
                  <Icon as={PenLine} size="xs" className="text-primary" />
                </View>
                <Text className="font-sans text-sm font-medium text-foreground">
                  {t('thoughts.rename_bucket')}
                </Text>
              </Pressable>

              {/* Delete */}
              <Pressable
                onPress={() => void handleDelete()}
                disabled={loading !== null}
                className="flex-row items-center gap-3 rounded-xl border border-destructive/25 px-4 py-3 active:bg-destructive/5"
              >
                <View className="h-8 w-8 items-center justify-center rounded-full bg-destructive/10">
                  {loading === 'delete' ? (
                    <Spinner className="text-destructive" />
                  ) : (
                    <Icon as={Trash2} size="xs" className="text-destructive" />
                  )}
                </View>
                <VStack className="min-w-0 flex-1">
                  <Text className="font-sans text-sm font-medium text-destructive">
                    {t('thoughts.delete_bucket')}
                  </Text>
                  <Text className="font-sans text-xs text-muted-foreground">
                    {t('thoughts.delete_bucket_confirm')}
                  </Text>
                </VStack>
              </Pressable>
            </>
          )}
        </VStack>
      </BottomSheetView>
    </BottomSheet>
  );
}
