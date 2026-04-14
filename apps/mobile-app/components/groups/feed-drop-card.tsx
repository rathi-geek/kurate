import React, { useCallback, useState } from 'react';
import { Alert as RNAlert } from 'react-native';
import { Share2, Trash2 } from 'lucide-react-native';
import { View } from '@/components/ui/view';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Pressable } from '@/components/ui/pressable';
import { Avatar } from '@/components/ui/avatar';
import { Icon } from '@/components/ui/icon';
import { useLocalization } from '@/context';
import { formatRelativeTime } from '@kurate/utils';
import type { GroupDrop } from '@kurate/types';
import { supabaseUrl } from '@/libs/supabase/client';
import { DropItemPreview } from '@/components/groups/drop-item-preview';
import { DropShareSheet } from '@/components/groups/drop-share-sheet';
import { EngagementBar } from '@/components/groups/engagement-bar';
import { CommentThreadSheet } from '@/components/groups/comment-thread-sheet';

interface FeedDropCardProps {
  drop: GroupDrop;
  currentUserId: string;
  currentRole?: string;
  onDelete: (dropId: string) => Promise<void> | void;
}

const STORAGE_BASE = supabaseUrl
  ? `${supabaseUrl}/storage/v1/object/public/`
  : '';

const avatarUrlFromPath = (path: string | null): string | null =>
  path ? `${STORAGE_BASE}${path}` : null;

export function FeedDropCard({
  drop,
  currentUserId,
  currentRole,
  onDelete,
}: FeedDropCardProps) {
  const { t } = useLocalization();
  const [shareOpen, setShareOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);

  const sharerAvatar = avatarUrlFromPath(drop.sharer.avatar_path);
  const canDelete = drop.shared_by === currentUserId || currentRole === 'owner';
  const canShare = !!drop.logged_item_id;
  const hasMustRead = drop.engagement.mustRead.count > 0;

  const handleDelete = useCallback(() => {
    RNAlert.alert(t('groups.delete_drop_confirm'), undefined, [
      { text: t('groups.cancel'), style: 'cancel' },
      {
        text: t('groups.danger_confirm_delete'),
        style: 'destructive',
        onPress: () => {
          void onDelete(drop.id);
        },
      },
    ]);
  }, [drop.id, onDelete, t]);

  return (
    <View>
      {/* Header — inside bg-card, p-4 matches web */}
      <HStack className="items-start gap-2 py-2">
        <Avatar
          uri={sharerAvatar}
          name={drop.sharer.display_name ?? drop.sharer.handle}
          size={32}
        />
        <VStack className="min-w-0 flex-1 gap-0.5">
          <Text
            numberOfLines={1}
            className="font-sans text-xs font-medium text-foreground"
          >
            {drop.sharer.display_name ?? drop.sharer.handle ?? ''}
          </Text>
          <Text className="font-mono text-[10px] text-muted-foreground">
            {formatRelativeTime(drop.shared_at)}
          </Text>
        </VStack>

        <HStack className="shrink-0 items-center gap-1">
          {canShare ? (
            <Pressable
              onPress={() => setShareOpen(true)}
              className="h-8 w-8 items-center justify-center rounded-full active:bg-accent"
              accessibilityLabel={t('vault.share_modal_title')}
            >
              <Icon as={Share2} size="xs" className="text-muted-foreground" />
            </Pressable>
          ) : null}
          {canDelete ? (
            <Pressable
              onPress={handleDelete}
              className="h-8 w-8 items-center justify-center rounded-full active:bg-destructive/10"
              accessibilityLabel={t('groups.delete_drop_aria')}
            >
              <Icon as={Trash2} size="xs" className="text-muted-foreground" />
            </Pressable>
          ) : null}
        </HStack>
      </HStack>

      <View
        className={`overflow-hidden rounded-xl border shadow-sm ${
          hasMustRead
            ? 'border-amber-400/30 bg-amber-50/40'
            : 'border-border bg-card'
        }`}
      >
        {/* Content — note + preview/text, padded */}
        <View className="gap-3">
          {drop.note ? (
            <Text className="px-3 pt-2  font-sans text-xs italic text-muted-foreground">
              {drop.note}
            </Text>
          ) : null}

          {drop.item ? (
            <DropItemPreview item={drop.item} />
          ) : drop.content ? (
            <View className="rounded-xl bg-secondary p-3">
              <Text className="font-sans text-sm text-foreground">
                {drop.content}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Engagement — border-t separator, same bg-card, matches web */}
        <EngagementBar
          drop={drop}
          currentUserId={currentUserId}
          onCommentsPress={() => setCommentsOpen(true)}
        />
      </View>

      <DropShareSheet
        open={shareOpen}
        loggedItemId={drop.logged_item_id}
        excludeGroupId={drop.convo_id}
        onClose={() => setShareOpen(false)}
      />

      <CommentThreadSheet
        open={commentsOpen}
        groupPostId={drop.id}
        groupId={drop.convo_id}
        currentRole={currentRole}
        onClose={() => setCommentsOpen(false)}
      />
    </View>
  );
}
