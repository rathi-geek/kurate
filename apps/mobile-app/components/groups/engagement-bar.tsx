import React, { useCallback } from 'react';
import { Heart, Star, Bookmark, MessageCircle } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { View } from '@/components/ui/view';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Avatar } from '@/components/ui/avatar';
import { useLocalization } from '@/context';
import { supabase, supabaseUrl } from '@/libs/supabase/client';
import { useAuthStore } from '@/store';
import { useDropEngagement, useVaultToggle } from '@kurate/hooks';
import type { GroupDrop, GroupProfile } from '@kurate/types';

interface EngagementBarProps {
  drop: GroupDrop;
  onCommentsPress?: () => void;
  showComments?: boolean;
}

const STORAGE_BASE = supabaseUrl
  ? `${supabaseUrl}/storage/v1/object/public/`
  : '';

const toAvatarUrl = (path: string | null): string | null =>
  path ? `${STORAGE_BASE}${path}` : null;

function ReactorPill({
  reactors,
  label,
}: {
  reactors: GroupProfile[];
  label: string;
}) {
  if (reactors.length === 0) return null;
  const shown = reactors.slice(0, 3);
  return (
    <HStack className="items-center gap-1.5 rounded-full border border-border/50 bg-secondary px-2 py-0.5">
      <HStack style={{ flexDirection: 'row' }}>
        {shown.map((r, i) => (
          <View key={r.id ?? i} style={{ marginLeft: i > 0 ? -4 : 0 }}>
            <Avatar
              uri={toAvatarUrl(r.avatar_path)}
              name={r.display_name}
              size={16}
            />
          </View>
        ))}
      </HStack>
      <Text className="font-sans text-[11px] text-muted-foreground">
        {label}
      </Text>
    </HStack>
  );
}

export function EngagementBar({
  drop,
  onCommentsPress,
  showComments = true,
}: EngagementBarProps) {
  const { t } = useLocalization();
  const currentUserId = useAuthStore(s => s.userId) ?? '';

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
  const hasComments = drop.commentCount > 0;

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

  return (
    <VStack className="gap-2 border-t border-border/50 px-4 py-3">
      {/* Reactor pills — stacked avatars + "liked" / "recommended" */}
      {(drop.engagement.like.reactors.length > 0 ||
        drop.engagement.mustRead.reactors.length > 0) && (
        <HStack className="items-center gap-3">
          <ReactorPill
            reactors={drop.engagement.like.reactors}
            label={t('groups.reaction_like_aria').toLowerCase()}
          />
          <ReactorPill
            reactors={drop.engagement.mustRead.reactors}
            label={t('groups.reaction_must_read_aria').toLowerCase()}
          />
        </HStack>
      )}

      {/* Engagement buttons — px-2 py-1 per button like web */}
      <HStack className="items-center justify-between">
        <HStack className="items-center gap-4">
          <Pressable
            onPress={handleToggleLike}
            className="flex-row items-center gap-1 rounded-[6px]  active:bg-accent/40"
            accessibilityLabel={t('groups.reaction_like_aria')}
          >
            <Icon
              as={Heart}
              size="2xs"
              className={
                liked
                  ? 'fill-current text-destructive'
                  : 'text-muted-foreground'
              }
            />
            {drop.engagement.like.count > 0 ? (
              <Text className="font-mono text-xs text-muted-foreground">
                {drop.engagement.like.count}
              </Text>
            ) : null}
          </Pressable>

          <Pressable
            onPress={handleToggleMustRead}
            className="flex-row items-center gap-1 rounded-[6px] py-1 active:bg-accent/40"
            accessibilityLabel={t('groups.reaction_must_read_aria')}
          >
            <Icon
              as={Star}
              size="2xs"
              className={
                mustRead ? 'fill-current text-primary' : 'text-muted-foreground'
              }
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
              className="flex-row items-center gap-1 rounded-[6px] py-1 active:bg-accent/40"
              accessibilityLabel={
                isSaved
                  ? t('groups.bookmark_remove_aria')
                  : t('groups.bookmark_save_aria')
              }
            >
              <Icon
                as={Bookmark}
                size="2xs"
                className={
                  isSaved
                    ? 'fill-current text-primary'
                    : 'text-muted-foreground'
                }
              />
            </Pressable>
          ) : null}
        </HStack>

        {showComments ? (
          <Pressable
            onPress={onCommentsPress}
            disabled={!onCommentsPress}
            className="flex-row items-center gap-1 rounded-[6px] px-2 active:bg-accent/40"
            accessibilityLabel={t('groups.comment_aria')}
          >
            <Icon
              as={MessageCircle}
              size="2xs"
              className={
                hasComments
                  ? 'fill-current text-primary'
                  : 'text-muted-foreground'
              }
            />
            {hasComments ? (
              <Text className="font-mono text-xs text-muted-foreground">
                {drop.commentCount}
              </Text>
            ) : null}
          </Pressable>
        ) : null}
      </HStack>
    </VStack>
  );
}
