import React, { useCallback } from 'react';

import FastImage from 'react-native-fast-image';
import { useRouter } from 'expo-router';

import type { Notification } from '@kurate/types';
import { formatRelativeTime } from '@kurate/utils';
import { supabase } from '@/libs/supabase/client';
import { useLocalization } from '@/context';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Text } from '@/components/ui/text';
import { View } from '@/components/ui/view';
import { Pressable } from '@/components/ui/pressable';

const NAVIGABLE_EVENTS = [
  'like',
  'must_read',
  'comment',
  'new_post',
  'also_must_read',
  'also_commented',
  'must_read_broadcast',
  'co_engaged',
  'group_invite',
  'mention',
];

interface NotificationItemProps {
  notification: Notification;
  markRead: (id: string) => Promise<void>;
}

export const NotificationItem = React.memo(function NotificationItem({
  notification,
  markRead,
}: NotificationItemProps) {
  const { t } = useLocalization();
  const router = useRouter();
  const actor = notification.actors[0] ?? null;

  const displayName = actor
    ? [actor.first_name, actor.last_name].filter(Boolean).join(' ') ||
      actor.handle ||
      'Someone'
    : 'Someone';

  const initial = displayName[0]?.toUpperCase() ?? '?';
  const eventKey = `notifications.event_${notification.event_type}`;
  const label = t(eventKey) ?? notification.message ?? notification.event_type;

  const handlePress = useCallback(async () => {
    await markRead(notification.id);

    if (
      !NAVIGABLE_EVENTS.includes(notification.event_type) ||
      !notification.event_id
    )
      return;

    // group_invite: event_id is the convo_id directly
    if (notification.event_type === 'group_invite') {
      router.push(`/groups/${notification.event_id}`);
      return;
    }

    const { data } = await supabase
      .from('group_posts')
      .select('convo_id')
      .eq('id', notification.event_id)
      .single();

    if (data) {
      router.push(`/groups/${data.convo_id}`);
    }
  }, [
    notification.id,
    notification.event_type,
    notification.event_id,
    markRead,
    router,
  ]);

  const timeAgo = formatRelativeTime(notification.created_at);

  return (
    <Pressable
      onPress={() => void handlePress()}
      className="px-4 py-3 active:bg-secondary"
    >
      <HStack space="md" className="items-start">
        {/* Avatar */}
        <View className="relative mt-0.5">
          <View className="h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-primary/10">
            {actor?.avatar_url ? (
              <FastImage
                source={{ uri: actor.avatar_url }}
                style={{ width: 36, height: 36, borderRadius: 9999 }}
                resizeMode={FastImage.resizeMode.cover}
              />
            ) : (
              <Text className="font-sans text-sm font-bold text-primary">
                {initial}
              </Text>
            )}
          </View>
          {!notification.is_read && (
            <View className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-primary" />
          )}
        </View>

        {/* Text content */}
        <VStack className="min-w-0 flex-1">
          <Text className="font-sans text-sm leading-snug text-foreground">
            <Text className="font-sans text-sm font-semibold text-foreground">
              {displayName}
            </Text>{' '}
            <Text className="font-sans text-sm text-muted-foreground">
              {label}
            </Text>
          </Text>
          <Text className="mt-0.5 font-sans text-xs text-muted-foreground">
            {timeAgo}
          </Text>
        </VStack>
      </HStack>
    </Pressable>
  );
});
