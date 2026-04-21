import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { FlashList, type FlashListRef } from '@shopify/flash-list';
import { ChevronLeft } from 'lucide-react-native';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { View } from '@/components/ui/view';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Pressable } from '@/components/ui/pressable';
import { Spinner } from '@/components/ui/spinner';
import { Icon } from '@/components/ui/icon';
import { Avatar } from '@/components/ui/avatar';
import { useLocalization } from '@/context';
import { useAuthStore } from '@/store';
import { useDMConversations } from '@/hooks/useDMConversations';
import { useDMMessages } from '@/hooks/useDMMessages';
import { useDMUnreadCounts } from '@/hooks/useDMUnreadCounts';
import { MessageBubble } from '@/components/people/message-bubble';
import { DmComposer } from '@/components/people/dm-composer';
import type { DMMessage } from '@kurate/types';

interface ReplyContext {
  messageId: string;
  senderName: string;
  text: string;
}

interface EditContext {
  messageId: string;
  text: string;
}

export default function ChatDetailScreen() {
  const { t } = useLocalization();
  const router = useRouter();
  const { convoId } = useLocalSearchParams<{ convoId: string }>();
  const chatConvoId = convoId ?? '';

  const userId = useAuthStore(state => state.userId) ?? '';
  const { conversations } = useDMConversations();
  const {
    messages,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useDMMessages(chatConvoId || null);
  const { markRead } = useDMUnreadCounts();

  const listRef = useRef<FlashListRef<DMMessage>>(null);

  // Find other user from cached conversations
  const otherUser = useMemo(() => {
    const convo = conversations.find(c => c.id === chatConvoId);
    return convo?.otherUser ?? null;
  }, [conversations, chatConvoId]);

  // Mark as read on mount
  useEffect(() => {
    if (chatConvoId) void markRead(chatConvoId);
  }, [chatConvoId, markRead]);

  // Mark read when new messages arrive
  useEffect(() => {
    if (chatConvoId && messages.length > 0) void markRead(chatConvoId);
  }, [chatConvoId, messages.length, markRead]);

  // Reply / edit state
  const [replyingTo, setReplyingTo] = useState<ReplyContext | null>(null);
  const [editingMessage, setEditingMessage] = useState<EditContext | null>(
    null,
  );

  const handleReply = useCallback((msg: DMMessage) => {
    setEditingMessage(null);
    setReplyingTo({
      messageId: msg.id,
      senderName: msg.sender.display_name ?? `@${msg.sender.handle}`,
      text: msg.message_text ?? '',
    });
  }, []);

  const handleEdit = useCallback((msg: DMMessage) => {
    setReplyingTo(null);
    setEditingMessage({
      messageId: msg.id,
      text: msg.message_text ?? '',
    });
  }, []);

  const handleMessageSent = useCallback(() => {
    listRef.current?.scrollToIndex({ index: 0, animated: true });
  }, []);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Inverted list: newest message at index 0
  const invertedMessages = useMemo(() => [...messages].reverse(), [messages]);

  const renderItem = useCallback(
    ({ item, index }: { item: DMMessage; index: number }) => {
      // In inverted list, index+1 is the message that appears above (older)
      const below = invertedMessages[index + 1];
      const isContinuation =
        !!below &&
        below.sender_id === item.sender_id &&
        new Date(item.created_at).getTime() -
          new Date(below.created_at).getTime() <
          5 * 60 * 1000;

      return (
        <MessageBubble
          message={item}
          currentUserId={userId}
          convoId={chatConvoId}
          allMessages={messages}
          onReply={handleReply}
          onEdit={handleEdit}
          isContinuation={isContinuation}
        />
      );
    },
    [invertedMessages, messages, userId, chatConvoId, handleReply, handleEdit],
  );

  const renderFooter = useCallback(
    () =>
      isFetchingNextPage ? (
        <View className="items-center py-3">
          <Spinner />
        </View>
      ) : !hasNextPage && messages.length > 0 ? (
        <View className="items-center py-4">
          <Text className="font-sans text-xs text-muted-foreground">
            {t('people.chat_beginning')}
          </Text>
        </View>
      ) : null,
    [isFetchingNextPage, hasNextPage, messages.length, t],
  );

  const displayName =
    otherUser?.display_name ??
    (otherUser?.handle ? `@${otherUser.handle}` : t('people.unknown'));

  return (
    <SafeAreaView
      className="flex-1 bg-background"
      edges={['top', 'left', 'right']}
    >
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        {/* Header */}
        <HStack className="items-center gap-3 border-b border-border/40 px-3 py-2">
          <Pressable onPress={() => router.back()} className="p-1">
            <Icon as={ChevronLeft} size="sm" className="text-foreground" />
          </Pressable>
          <Avatar
            uri={otherUser?.avatar_url}
            name={otherUser?.display_name ?? otherUser?.handle}
            size={32}
          />
          <Text
            numberOfLines={1}
            className="flex-1 font-sans text-base font-semibold text-foreground"
          >
            {displayName}
          </Text>
        </HStack>

        {/* Messages */}
        <View className="flex-1">
          {isLoading && messages.length === 0 ? (
            <VStack className="flex-1 items-center justify-center">
              <Spinner />
            </VStack>
          ) : messages.length === 0 ? (
            <VStack className="flex-1 items-center justify-center px-8">
              <Text className="text-center font-sans text-sm text-muted-foreground">
                {t('people.chat_empty')}
              </Text>
            </VStack>
          ) : (
            <FlashList
              ref={listRef}
              data={invertedMessages}
              keyExtractor={m => m.id}
              renderItem={renderItem}
              ListFooterComponent={renderFooter}
              inverted
              onEndReached={handleEndReached}
              onEndReachedThreshold={0.5}
              maintainVisibleContentPosition={{
                autoscrollToTopThreshold: 10,
                animateAutoScrollToBottom: true,
              }}
            />
          )}
        </View>

        {/* Composer */}
        <DmComposer
          convoId={chatConvoId}
          currentUserId={userId}
          replyTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
          editingMessage={editingMessage}
          onCancelEdit={() => setEditingMessage(null)}
          onMessageSent={handleMessageSent}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
