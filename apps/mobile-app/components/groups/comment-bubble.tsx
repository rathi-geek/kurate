import React, { useCallback } from 'react';
import { Alert as RNAlert } from 'react-native';
import { View } from '@/components/ui/view';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Pressable } from '@/components/ui/pressable';
import { Avatar } from '@/components/ui/avatar';
import { useLocalization } from '@/context';
import { formatRelativeTime } from '@kurate/utils';
import type { DropComment } from '@kurate/types';
import { supabaseUrl } from '@/libs/supabase/client';

interface CommentBubbleProps {
  comment: DropComment;
  isOwn: boolean;
  showAuthor: boolean;
  canDelete: boolean;
  onDelete: (commentId: string) => void;
}

const STORAGE_BASE = supabaseUrl
  ? `${supabaseUrl}/storage/v1/object/public/`
  : '';

const avatarUrlFromPath = (path: string | null): string | null =>
  path ? `${STORAGE_BASE}${path}` : null;

export const CommentBubble = React.memo(function CommentBubble({
  comment,
  isOwn,
  showAuthor,
  canDelete,
  onDelete,
}: CommentBubbleProps) {
  const { t } = useLocalization();

  const handleLongPress = useCallback(() => {
    if (!canDelete) return;
    RNAlert.alert(t('groups.delete_comment_aria'), undefined, [
      { text: t('groups.cancel'), style: 'cancel' },
      {
        text: t('groups.danger_confirm_delete'),
        style: 'destructive',
        onPress: () => onDelete(comment.id),
      },
    ]);
  }, [canDelete, comment.id, onDelete, t]);

  if (isOwn) {
    return (
      <View className="items-end px-4 py-1">
        <Pressable
          onLongPress={handleLongPress}
          delayLongPress={300}
          className="max-w-[80%] rounded-2xl rounded-tr-sm bg-primary px-3 py-2 active:opacity-80"
        >
          <Text className="font-sans text-sm text-primary-foreground">
            {comment.comment_text}
          </Text>
          <Text className="mt-0.5 text-right font-mono text-[10px] text-primary-foreground/70">
            {formatRelativeTime(comment.created_at)}
          </Text>
        </Pressable>
      </View>
    );
  }

  const avatar = avatarUrlFromPath(comment.author_avatar_path);
  const name = comment.author_display_name ?? comment.author_handle ?? '';

  return (
    <View className="px-4 py-1">
      <HStack className="items-end gap-2">
        <View style={{ width: 28 }}>
          {showAuthor ? <Avatar uri={avatar} name={name} size={28} /> : null}
        </View>
        <VStack className="max-w-[80%] gap-0.5">
          {showAuthor ? (
            <Text className="ml-1 font-sans text-xs text-muted-foreground">
              {name}
            </Text>
          ) : null}
          <Pressable
            onLongPress={handleLongPress}
            delayLongPress={300}
            className="rounded-2xl rounded-tl-sm border border-border bg-card px-3 py-2 active:opacity-80"
          >
            <Text className="font-sans text-sm text-foreground">
              {comment.comment_text}
            </Text>
            <Text className="mt-0.5 font-mono text-[10px] text-muted-foreground">
              {formatRelativeTime(comment.created_at)}
            </Text>
          </Pressable>
        </VStack>
      </HStack>
    </View>
  );
});
