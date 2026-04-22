import React, { useEffect, useMemo, useRef } from 'react';
import Toast from 'react-native-toast-message';
import {
  BottomSheet,
  BottomSheetView,
  type BottomSheetHandle,
} from '@/components/ui/bottom-sheet';
import { View } from '@/components/ui/view';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Pressable } from '@/components/ui/pressable';
import { ArrowRightLeft, Trash2 } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { useLocalization } from '@/context';

import type { BucketSummary } from '@kurate/hooks';

interface ThoughtActionSheetProps {
  open: boolean;
  thoughtId: string | null;
  currentBucket: string | null;
  buckets: BucketSummary[];
  onClose: () => void;
  onMove: (thoughtId: string, newBucket: string) => void;
  onDelete: (thoughtId: string) => void;
}

export function ThoughtActionSheet({
  open,
  thoughtId,
  currentBucket,
  buckets,
  onClose,
  onMove,
  onDelete,
}: ThoughtActionSheetProps) {
  const { t } = useLocalization();
  const sheetRef = useRef<BottomSheetHandle>(null);

  useEffect(() => {
    if (open) sheetRef.current?.present();
    else sheetRef.current?.dismiss();
  }, [open]);

  const otherBuckets = useMemo(
    () => buckets.filter(b => b.bucket !== currentBucket),
    [buckets, currentBucket],
  );

  const handleMove = (targetSlug: string, targetLabel: string) => {
    if (!thoughtId) return;
    onMove(thoughtId, targetSlug);
    Toast.show({
      type: 'success',
      text1: t('thoughts.moved_to', { bucket: targetLabel }),
    });
    onClose();
  };

  const handleDelete = () => {
    if (!thoughtId) return;
    onDelete(thoughtId);
    onClose();
  };

  if (!thoughtId) return null;

  return (
    <BottomSheet ref={sheetRef} onDismiss={onClose}>
      <BottomSheetView>
        <VStack className="gap-2 px-4 pb-8 pt-2">
          {/* Move section */}
          {otherBuckets.length > 0 && (
            <>
              <HStack className="items-center gap-2 px-1 pb-1">
                <Icon
                  as={ArrowRightLeft}
                  size="xs"
                  className="text-muted-foreground"
                />
                <Text className="font-sans text-xs font-medium text-muted-foreground">
                  {t('thoughts.move_to_bucket')}
                </Text>
              </HStack>
              {otherBuckets.map(b => (
                <Pressable
                  key={b.bucket}
                  onPress={() => handleMove(b.bucket, b.bucketLabel)}
                  className="flex-row items-center gap-3 rounded-xl border border-border px-4 py-3 active:bg-accent/40"
                >
                  <View
                    className="h-4 w-4 rounded-full"
                    style={{
                      backgroundColor: b.color,
                    }}
                  />
                  <Text className="font-sans text-sm font-medium text-foreground">
                    {b.bucketLabel}
                  </Text>
                </Pressable>
              ))}
            </>
          )}

          {/* Delete */}
          <Pressable
            onPress={handleDelete}
            className="mt-2 flex-row items-center gap-3 rounded-xl border border-destructive/25 px-4 py-3 active:bg-destructive/5"
          >
            <View className="h-8 w-8 items-center justify-center rounded-full bg-destructive/10">
              <Icon as={Trash2} size="xs" className="text-destructive" />
            </View>
            <Text className="font-sans text-sm font-medium text-destructive">
              {t('thoughts.delete_thought')}
            </Text>
          </Pressable>
        </VStack>
      </BottomSheetView>
    </BottomSheet>
  );
}
