import React, { useCallback, useMemo } from 'react';
import { Alert as RNAlert, type AlertButton, Linking } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { View } from '@/components/ui/view';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Pressable } from '@/components/ui/pressable';
import { Image } from '@/components/ui/fast-image';
import { supabase } from '@/libs/supabase/client';
import { queryKeys } from '@kurate/query';
import { decodeHtmlEntities, EMOJI_ROWS } from '@kurate/utils';
import { useLocalization } from '@/context';
import type { DMMessage } from '@kurate/types';

const QUICK_EMOJIS = EMOJI_ROWS[0] ?? [];

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function safeHostname(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

interface MessageBubbleProps {
  message: DMMessage;
  currentUserId: string;
  convoId: string;
  allMessages: DMMessage[];
  onReply: (msg: DMMessage) => void;
  onEdit: (msg: DMMessage) => void;
  isContinuation: boolean;
}

export const MessageBubble = React.memo(function MessageBubble({
  message,
  currentUserId,
  convoId,
  allMessages,
  onReply,
  onEdit,
  isContinuation,
}: MessageBubbleProps) {
  const { t } = useLocalization();
  const queryClient = useQueryClient();
  const isOwn = message.sender_id === currentUserId;

  const groupedReactions = useMemo(() => {
    const acc: Record<string, { count: number; myReaction: boolean }> = {};
    for (const r of message.reactions) {
      if (!acc[r.emoji]) acc[r.emoji] = { count: 0, myReaction: false };
      acc[r.emoji]!.count++;
      if (r.user_id === currentUserId) acc[r.emoji]!.myReaction = true;
    }
    return acc;
  }, [message.reactions, currentUserId]);

  const parentMessage = message.message_parent_id
    ? allMessages.find(m => m.id === message.message_parent_id)
    : null;

  const invalidate = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: queryKeys.people.messages(convoId),
    });
  }, [queryClient, convoId]);

  const handleReact = useCallback(
    async (emoji: string) => {
      const existing = groupedReactions[emoji]?.myReaction;
      if (existing) {
        await supabase
          .from('message_reactions')
          .delete()
          .eq('message_id', message.id)
          .eq('user_id', currentUserId)
          .eq('emoji', emoji);
      } else {
        await supabase
          .from('message_reactions')
          .insert({ message_id: message.id, user_id: currentUserId, emoji });
      }
      await invalidate();
    },
    [groupedReactions, message.id, currentUserId, invalidate],
  );

  const handleDelete = useCallback(async () => {
    RNAlert.alert(
      t('people.delete_confirm_title'),
      t('people.delete_confirm_description'),
      [
        { text: t('people.delete_confirm_cancel'), style: 'cancel' },
        {
          text: t('people.delete_confirm_action'),
          style: 'destructive',
          onPress: async () => {
            await supabase.from('messages').delete().eq('id', message.id);
            await invalidate();
            await queryClient.invalidateQueries({
              queryKey: queryKeys.people.conversations(),
            });
          },
        },
      ],
    );
  }, [message.id, invalidate, queryClient, t]);

  const showEmojiPicker = useCallback(() => {
    RNAlert.alert(t('people.bubble_react_aria'), undefined, [
      ...QUICK_EMOJIS.slice(0, 6).map(emoji => ({
        text: emoji,
        onPress: () => void handleReact(emoji),
      })),
      { text: t('people.delete_confirm_cancel'), style: 'cancel' as const },
    ]);
  }, [handleReact, t]);

  const handleLongPress = useCallback(() => {
    const buttons: AlertButton[] = [
      { text: t('people.bubble_react_aria'), onPress: showEmojiPicker },
      { text: t('people.bubble_reply_aria'), onPress: () => onReply(message) },
    ];
    if (isOwn && message.message_type === 'text') {
      buttons.push({
        text: t('people.composer_editing'),
        onPress: () => onEdit(message),
      });
    }
    if (isOwn) {
      buttons.push({
        text: t('people.delete_confirm_action'),
        style: 'destructive',
        onPress: handleDelete,
      });
    }
    buttons.push({ text: t('people.delete_confirm_cancel'), style: 'cancel' });
    RNAlert.alert(undefined as unknown as string, undefined, buttons);
  }, [isOwn, message, onReply, onEdit, handleDelete, showEmojiPicker, t]);

  const bubbleClass = isOwn
    ? 'rounded-2xl rounded-br-sm bg-primary px-3 py-2'
    : 'rounded-2xl rounded-bl-sm border border-border bg-card px-3 py-2';

  return (
    <View
      className={`px-4 ${isContinuation ? 'pb-1 pt-0.5' : 'py-1'} ${isOwn ? 'items-end' : 'items-start'}`}
    >
      <VStack
        className={`max-w-[80%] gap-0.5 ${isOwn ? 'items-end' : 'items-start'}`}
      >
        <Pressable
          onLongPress={handleLongPress}
          delayLongPress={300}
          className={`${bubbleClass} active:opacity-80`}
        >
          {/* Quoted parent */}
          {parentMessage && (
            <View
              className={`mb-2 rounded-lg border-l-2 py-1 pl-2 pr-1 ${isOwn ? 'border-white/40 bg-white/10' : 'border-primary/40 bg-background/60'}`}
            >
              <Text
                className={`font-sans text-[11px] font-semibold ${isOwn ? 'text-white/80' : 'text-foreground/70'}`}
              >
                {parentMessage.sender.display_name ??
                  `@${parentMessage.sender.handle}`}
              </Text>
              <Text
                numberOfLines={2}
                className={`font-sans text-[11px] ${isOwn ? 'text-white/60' : 'text-muted-foreground'}`}
              >
                {parentMessage.message_text ||
                  decodeHtmlEntities(parentMessage.item?.title) ||
                  t('people.link_fallback')}
              </Text>
            </View>
          )}

          {/* Note above link */}
          {message.message_type === 'logged_item' && message.message_text ? (
            <Text
              className={`mb-2 font-sans text-sm ${isOwn ? 'text-primary-foreground' : 'text-foreground'}`}
            >
              {message.message_text}
            </Text>
          ) : null}

          {/* Link card */}
          {message.message_type === 'logged_item' && message.item ? (
            <Pressable
              onPress={() => void Linking.openURL(message.item!.url)}
              className={`mb-1 overflow-hidden rounded-xl border ${isOwn ? 'border-white/20 bg-white/10' : 'border-border bg-background'}`}
            >
              {message.item.preview_image_url ? (
                <Image
                  source={{ uri: message.item.preview_image_url }}
                  style={{ width: '100%', height: 128 }}
                />
              ) : null}
              <View className="p-2">
                {message.item.title ? (
                  <Text
                    numberOfLines={2}
                    className={`font-sans text-xs font-medium ${isOwn ? 'text-white' : 'text-foreground'}`}
                  >
                    {decodeHtmlEntities(message.item.title)}
                  </Text>
                ) : null}
                {message.item.description ? (
                  <Text
                    numberOfLines={2}
                    className={`mt-0.5 font-sans text-[10px] ${isOwn ? 'text-white/70' : 'text-muted-foreground'}`}
                  >
                    {decodeHtmlEntities(message.item.description)}
                  </Text>
                ) : null}
                <Text
                  className={`mt-1 font-mono text-[10px] ${isOwn ? 'text-white/50' : 'text-muted-foreground/70'}`}
                >
                  {safeHostname(message.item.url)}
                </Text>
              </View>
            </Pressable>
          ) : null}

          {/* Text + timestamp row */}
          <HStack className="items-end justify-between gap-2">
            {message.message_type === 'text' && (
              <Text
                className={`flex-1 font-sans text-sm leading-5 ${isOwn ? 'text-primary-foreground' : 'text-foreground'}`}
              >
                {message.message_text}
              </Text>
            )}
            <Text
              className={`text-[9px] leading-3 ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground/60'}`}
            >
              {formatTime(message.created_at)}
            </Text>
          </HStack>
        </Pressable>

        {/* Reactions bar */}
        {Object.keys(groupedReactions).length > 0 && (
          <HStack className="flex-wrap gap-1 px-1">
            {Object.entries(groupedReactions).map(
              ([emoji, { count, myReaction }]) => (
                <Pressable
                  key={emoji}
                  onPress={() => void handleReact(emoji)}
                  className={`flex-row items-center gap-0.5 rounded-full border px-1.5 py-0.5 ${myReaction ? 'border-primary/40 bg-primary/10' : 'border-border bg-background'}`}
                >
                  <Text style={{ fontSize: 11 }}>{emoji}</Text>
                  <Text
                    className={`font-sans text-[11px] font-medium ${myReaction ? 'text-primary' : 'text-foreground'}`}
                  >
                    {count}
                  </Text>
                </Pressable>
              ),
            )}
          </HStack>
        )}
      </VStack>
    </View>
  );
});
