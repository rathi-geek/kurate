import React, { useCallback } from 'react';
import { Heart, Star, Bookmark, MessageCircle } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Avatar } from '@/components/ui/avatar';
import { useLocalization } from '@/context';
import { supabase, supabaseUrl } from '@/libs/supabase/client';
import { useDropEngagement, useVaultToggle } from '@kurate/hooks';
import type { GroupDrop } from '@kurate/types';

interface EngagementBarProps {
  drop: GroupDrop;
  currentUserId: string;
  onCommentsPress?: () => void;
  showComments?: boolean;
}

const STORAGE_BASE = supabaseUrl
  ? `${supabaseUrl}/storage/v1/object/public/`
  : '';

export function EngagementBar({
  drop,
  currentUserId,
  onCommentsPress,
  showComments = true,
}: EngagementBarProps) {
  const { t } = useLocalization();

  const handleEngagementError = useCallback(
    (message: string) => Toast.show({ type: 'error', text1: message }),
    [],
  );
  const { toggleReaction } = useDropEngagement(supabase, handleEngagementError);

  const itemUrl = drop.item?.url ?? '';
  const { isSaved, toggle: toggleVault } = useVaultToggle(
    supabase,
    currentUserId,
    itemUrl,
    drop.convo_id,
  );

  const liked = drop.engagement.like.didReact;
  const mustRead = drop.engagement.mustRead.didReact;

  const handleToggleLike = useCallback(() => {
    toggleReaction({
      groupPostId: drop.id,
      groupId: drop.convo_id,
      reactionType: 'like',
      currentUserId,
      didReact: liked,
    });
  }, [toggleReaction, drop.id, drop.convo_id, currentUserId, liked]);

  const handleToggleMustRead = useCallback(() => {
    toggleReaction({
      groupPostId: drop.id,
      groupId: drop.convo_id,
      reactionType: 'must_read',
      currentUserId,
      didReact: mustRead,
    });
  }, [toggleReaction, drop.id, drop.convo_id, currentUserId, mustRead]);

  const handleToggleBookmark = useCallback(() => {
    if (!drop.item) return;
    if (isSaved) {
      toggleVault();
      Toast.show({ type: 'info', text1: t('groups.toast_vault_removed') });
    } else {
      toggleVault({
        title: drop.item.title,
        preview_image: drop.item.preview_image_url,
        content_type: drop.item.content_type,
        description: drop.item.description,
      });
      Toast.show({ type: 'success', text1: t('groups.toast_vault_saved') });
    }
  }, [drop.item, isSaved, toggleVault, t]);

  const latestComment = drop.latestComment;
  const latestCommentAvatar = latestComment?.authorAvatarPath
    ? `${STORAGE_BASE}${latestComment.authorAvatarPath}`
    : null;

  return (
    <VStack className="gap-2 px-2">
      <HStack className="items-center justify-between">
        <HStack className="items-center gap-4">
          <Pressable
            onPress={handleToggleLike}
            className="flex-row items-center gap-1 active:opacity-60"
            accessibilityLabel={t('groups.reaction_like_aria')}
          >
            <Icon
              as={Heart}
              size="xs"
              className={liked ? 'text-destructive' : 'text-muted-foreground'}
              fill={liked ? 'currentColor' : 'none'}
            />
            {drop.engagement.like.count > 0 ? (
              <Text className="font-mono text-xs text-muted-foreground">
                {drop.engagement.like.count}
              </Text>
            ) : null}
          </Pressable>

          <Pressable
            onPress={handleToggleMustRead}
            className="flex-row items-center gap-1 active:opacity-60"
            accessibilityLabel={t('groups.reaction_must_read_aria')}
          >
            <Icon
              as={Star}
              size="xs"
              className={mustRead ? 'text-primary' : 'text-muted-foreground'}
              fill={mustRead ? 'currentColor' : 'none'}
            />
            {drop.engagement.mustRead.count > 0 ? (
              <Text className="font-mono text-xs text-muted-foreground">
                {drop.engagement.mustRead.count}
              </Text>
            ) : null}
          </Pressable>

          {drop.item ? (
            <Pressable
              onPress={handleToggleBookmark}
              className="flex-row items-center gap-1 active:opacity-60"
              accessibilityLabel={
                isSaved
                  ? t('groups.bookmark_remove_aria')
                  : t('groups.bookmark_save_aria')
              }
            >
              <Icon
                as={Bookmark}
                size="xs"
                className={isSaved ? 'text-primary' : 'text-muted-foreground'}
                fill={isSaved ? 'currentColor' : 'none'}
              />
            </Pressable>
          ) : null}
        </HStack>

        {showComments ? (
          <Pressable
            onPress={onCommentsPress}
            disabled={!onCommentsPress}
            className="flex-row items-center gap-1 active:opacity-60"
            accessibilityLabel={t('groups.comment_aria')}
          >
            <Icon
              as={MessageCircle}
              size="xs"
              className="text-muted-foreground"
            />
            {drop.commentCount > 0 ? (
              <Text className="font-mono text-xs text-muted-foreground">
                {drop.commentCount}
              </Text>
            ) : null}
          </Pressable>
        ) : null}
      </HStack>

      {showComments && latestComment ? (
        <Pressable
          onPress={onCommentsPress}
          disabled={!onCommentsPress}
          className="flex-row items-center gap-2 active:opacity-60"
          accessibilityLabel={t('groups.comment_aria')}
        >
          <Avatar
            uri={latestCommentAvatar}
            name={latestComment.authorName ?? ''}
            size={20}
          />
          <Text
            numberOfLines={1}
            className="min-w-0 flex-1 font-sans text-xs text-muted-foreground"
          >
            {latestComment.authorName ? (
              <Text className="font-sans text-xs font-medium text-foreground">
                {latestComment.authorName}
                {': '}
              </Text>
            ) : null}
            {latestComment.text}
          </Text>
        </Pressable>
      ) : null}
    </VStack>
  );
}
