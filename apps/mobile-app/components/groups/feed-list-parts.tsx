import React from 'react';
import { View } from '@/components/ui/view';
import { Spinner } from '@/components/ui/spinner';
import type { GroupFeedEntry } from '@kurate/hooks';
import { FeedDropCard } from '@/components/groups/feed-drop-card';
import { PendingGroupPostCard } from '@/components/groups/pending-group-post-card';

/* ── FlashList row ── */

export interface FeedEntryItemProps {
  entry: GroupFeedEntry;
  currentRole?: string;
  onDelete: (dropId: string) => Promise<void> | void;
  onRetry: (tempId: string) => void;
  onDismiss: (tempId: string) => void;
  openCommentsForDropId?: string | null;
  onCommentsOpened?: () => void;
}

export const FeedEntryItem = React.memo(function FeedEntryItem({
  entry,
  currentRole,
  onDelete,
  onRetry,
  onDismiss,
  openCommentsForDropId,
  onCommentsOpened,
}: FeedEntryItemProps) {
  if (entry.kind === 'pending') {
    return (
      <PendingGroupPostCard
        row={entry.data}
        onRetry={onRetry}
        onDismiss={onDismiss}
      />
    );
  }
  return (
    <FeedDropCard
      drop={entry.data}
      currentRole={currentRole}
      onDelete={onDelete}
      autoOpenComments={openCommentsForDropId === entry.data.id}
      onCommentsOpened={onCommentsOpened}
    />
  );
});

/* ── FlashList helpers ── */

export function ItemSeparator() {
  return <View className="h-3" />;
}

export function LoadingFooter() {
  return (
    <View className="items-center py-4">
      <Spinner />
    </View>
  );
}
