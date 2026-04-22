import React from 'react';
import { View } from '@/components/ui/view';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Pressable } from '@/components/ui/pressable';
import { Avatar } from '@/components/ui/avatar';
import { formatRelativeTime } from '@kurate/utils';
import type { DMConversation } from '@kurate/types';
import { useLocalization } from '@/context';

interface ConversationRowProps {
  conversation: DMConversation;
  unreadCount: number;
  onPress: () => void;
}

export const ConversationRow = React.memo(function ConversationRow({
  conversation,
  unreadCount,
  onPress,
}: ConversationRowProps) {
  const { t } = useLocalization();
  const { otherUser, lastMessage } = conversation;
  const isUnread = unreadCount > 0;

  const displayName =
    otherUser.display_name ??
    (otherUser.handle ? `@${otherUser.handle}` : t('people.unknown'));

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 active:bg-accent"
    >
      <Avatar
        uri={otherUser.avatar_url}
        name={otherUser.display_name ?? otherUser.handle}
        size={38}
      />
      <VStack className="min-w-0 flex-1 gap-0.5">
        <HStack className="items-baseline justify-between gap-2">
          <Text
            numberOfLines={1}
            className={`flex-1 font-sans text-sm text-foreground ${isUnread ? 'font-bold' : 'font-semibold'}`}
          >
            {displayName}
          </Text>
          {lastMessage && (
            <Text className="shrink-0 font-mono text-[10px] text-muted-foreground">
              {formatRelativeTime(lastMessage.sentAt)}
            </Text>
          )}
        </HStack>
        {lastMessage && (
          <HStack className="items-center gap-2">
            <Text
              numberOfLines={1}
              className="min-w-0 flex-1 font-sans text-xs text-muted-foreground"
            >
              {lastMessage.text}
            </Text>
            {isUnread && (
              <View className="h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-primary px-1">
                <Text
                  className="font-sans text-[10px] font-bold text-primary-foreground"
                  style={{ lineHeight: 12 }}
                >
                  {unreadCount > 99 ? '99+' : String(unreadCount)}
                </Text>
              </View>
            )}
          </HStack>
        )}
      </VStack>
    </Pressable>
  );
});
