import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { FlashList, type FlashListRef } from '@shopify/flash-list';
import { X } from 'lucide-react-native';
import {
  BottomSheet,
  type BottomSheetHandle,
} from '@/components/ui/bottom-sheet';
import { View } from '@/components/ui/view';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Pressable } from '@/components/ui/pressable';
import { Icon } from '@/components/ui/icon';
import { Spinner } from '@/components/ui/spinner';
import { useLocalization } from '@/context';
import { supabase } from '@/libs/supabase/client';
import { useAuthStore } from '@/store';
import { useProfile } from '@/hooks/useProfile';
import { useComments } from '@kurate/hooks';
import type { DropComment } from '@kurate/types';
import { CommentBubble } from '@/components/groups/comment-bubble';
import { ReplyInput } from '@/components/groups/reply-input';

interface CommentThreadSheetProps {
  open: boolean;
  groupPostId: string;
  groupId: string;
  /** Group owner can delete any comment; otherwise only the author can delete. */
  currentRole?: string;
  onClose: () => void;
}

export function CommentThreadSheet({
  open,
  groupPostId,
  groupId,
  currentRole,
  onClose,
}: CommentThreadSheetProps) {
  const { t } = useLocalization();
  const userId = useAuthStore(state => state.userId) ?? '';
  const sheetRef = useRef<BottomSheetHandle>(null);
  const listRef = useRef<FlashListRef<DropComment>>(null);
  const snapPoints = useMemo(() => ['75%'], []);

  const { data: profile } = useProfile(userId);
  const currentUserProfile = useMemo(
    () =>
      profile
        ? {
            id: profile.id,
            display_name:
              [profile.firstName, profile.lastName].filter(Boolean).join(' ') ||
              profile.handle ||
              null,
            avatar_path: profile.avatarPath,
            handle: profile.handle ?? '',
          }
        : undefined,
    [profile],
  );

  const {
    comments,
    isLoading,
    addComment,
    deleteComment,
    isAdding,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useComments(supabase, groupPostId, groupId, currentUserProfile);

  // Newest at the bottom of the visual list (chat-style):
  // hook returns comments oldest→newest. Inverted FlashList wants newest→oldest in data.
  const inverted = useMemo(() => [...comments].reverse(), [comments]);

  useEffect(() => {
    if (open) sheetRef.current?.present();
    else sheetRef.current?.dismiss();
  }, [open]);

  const handleSubmit = useCallback(
    (text: string) => {
      if (!userId) return;
      addComment(text, userId);
      // After insert, scroll to the newest (offset 0 in inverted list).
      requestAnimationFrame(() => {
        listRef.current?.scrollToOffset({ offset: 0, animated: true });
      });
    },
    [addComment, userId],
  );

  const handleDelete = useCallback(
    (commentId: string) => {
      if (!userId) return;
      deleteComment(commentId, userId);
    },
    [deleteComment, userId],
  );

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderItem = useCallback(
    ({ item, index }: { item: DropComment; index: number }) => {
      const isOwn = item.user_id === userId;
      // In the inverted array, the "previous" bubble visually-above is at index+1.
      const above = inverted[index + 1];
      const isContinuation =
        !!above &&
        above.user_id === item.user_id &&
        new Date(item.created_at).getTime() -
          new Date(above.created_at).getTime() <
          5 * 60 * 1000;
      const showAuthor = !isOwn && !isContinuation;
      const canDelete = isOwn || currentRole === 'owner';
      return (
        <CommentBubble
          comment={item}
          isOwn={isOwn}
          showAuthor={showAuthor}
          canDelete={canDelete}
          onDelete={handleDelete}
        />
      );
    },
    [inverted, userId, currentRole, handleDelete],
  );

  const renderFooter = useCallback(
    () =>
      isFetchingNextPage ? (
        <View className="items-center py-3">
          <Spinner />
        </View>
      ) : null,
    [isFetchingNextPage],
  );

  return (
    <BottomSheet
      ref={sheetRef}
      snapPoints={snapPoints}
      enableDynamicSizing={false}
      onDismiss={onClose}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
    >
      <View className="flex-1">
        <HStack className="items-center justify-between border-b border-border px-4 py-3">
          <Text className="font-sans text-base font-semibold text-foreground">
            {t('groups.comment_aria')}
            {comments.length > 0 ? ` · ${comments.length}` : ''}
          </Text>
          <Pressable
            onPress={onClose}
            className="h-8 w-8 items-center justify-center rounded-full active:bg-accent"
            accessibilityLabel={t('groups.cancel')}
          >
            <Icon as={X} size="xs" className="text-muted-foreground" />
          </Pressable>
        </HStack>

        <View className="flex-1">
          {isLoading && comments.length === 0 ? (
            <VStack className="flex-1 items-center justify-center">
              <Spinner />
            </VStack>
          ) : comments.length === 0 ? (
            <VStack className="flex-1 items-center justify-center px-8">
              <Text className="text-center font-sans text-sm text-muted-foreground">
                {t('groups.comment_placeholder')}
              </Text>
            </VStack>
          ) : (
            <FlashList
              ref={listRef}
              data={inverted}
              keyExtractor={c => c.id}
              renderItem={renderItem}
              ListFooterComponent={renderFooter}
              inverted
              onEndReached={handleEndReached}
              onEndReachedThreshold={0.5}
              contentContainerStyle={{ paddingVertical: 8 }}
            />
          )}
        </View>

        <ReplyInput onSubmit={handleSubmit} isSubmitting={isAdding} />
      </View>
    </BottomSheet>
  );
}
