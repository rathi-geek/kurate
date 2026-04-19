import { useCallback, useEffect, useMemo, useRef } from 'react';
import { FlashList, type FlashListRef } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BottomSheet,
  type BottomSheetHandle,
} from '@/components/ui/bottom-sheet';
import { View } from '@/components/ui/view';
import { VStack } from '@/components/ui/vstack';
import { Text } from '@/components/ui/text';
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
  const { top: topInset, bottom: bottomInset } = useSafeAreaInsets();
  const sheetRef = useRef<BottomSheetHandle>(null);
  const listRef = useRef<FlashListRef<DropComment>>(null);

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

  const inverted = useMemo(() => [...comments].reverse(), [comments]);
  const shouldScrollRef = useRef(false);
  const hasScrolledToBottom = useRef(false);

  useEffect(() => {
    if (open) {
      sheetRef.current?.present();
      hasScrolledToBottom.current = false;
    } else {
      sheetRef.current?.dismiss();
    }
  }, [open]);

  // Snap to bottom on initial load
  useEffect(() => {
    if (inverted.length > 0 && !hasScrolledToBottom.current) {
      listRef.current?.scrollToOffset({ offset: 0, animated: false });
      hasScrolledToBottom.current = true;
    }
  }, [inverted]);

  // Scroll to newest after own comment lands in the list
  useEffect(() => {
    if (shouldScrollRef.current && inverted.length > 0) {
      shouldScrollRef.current = false;
      listRef.current?.scrollToIndex({ index: 0, animated: true });
    }
  }, [inverted]);

  const handleSubmit = useCallback(
    (text: string) => {
      if (!userId) return;
      shouldScrollRef.current = true;
      addComment(text, userId);
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

  const renderListFooter = useCallback(
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
      snapPoints={['75%']}
      enableDynamicSizing={false}
      onDismiss={onClose}
      topInset={topInset}
      bottomInset={bottomInset}
      android_keyboardInputMode="adjustResize"
    >
      <VStack className="flex-1 gap-1">
        <Text className=" border-b border-border pb-2 text-center font-sans text-base font-semibold text-foreground">
          {t('groups.comment_aria')}
        </Text>

        <View className="flex-1 ">
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
              ListFooterComponent={renderListFooter}
              inverted
              onEndReached={handleEndReached}
              onEndReachedThreshold={0.5}
              maintainVisibleContentPosition={{
                autoscrollToTopThreshold: 10, // handles new messages (visual bottom in inverted)
                animateAutoScrollToBottom: true,
              }}
            />
          )}
        </View>
        <ReplyInput onSubmit={handleSubmit} isSubmitting={isAdding} />
      </VStack>
    </BottomSheet>
  );
}
