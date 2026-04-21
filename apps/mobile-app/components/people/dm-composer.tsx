import React, { useCallback, useEffect, useRef, useState } from 'react';
import { TextInput } from 'react-native';
import { Send, X } from 'lucide-react-native';
import { useQueryClient } from '@tanstack/react-query';
import { View } from '@/components/ui/view';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Pressable } from '@/components/ui/pressable';
import { Icon } from '@/components/ui/icon';
import { Image } from '@/components/ui/fast-image';
import { useLocalization } from '@/context';
import { useExtractMetadata } from '@/hooks/useExtractMetadata';
import { upsertLoggedItem } from '@/libs/upsertLoggedItem';
import { supabase } from '@/libs/supabase/client';
import { queryKeys } from '@kurate/query';
import { lightTheme } from '@kurate/theme';

const URL_REGEX = /https?:\/\/[^\s]+/;

interface ReplyContext {
  messageId: string;
  senderName: string;
  text: string;
}

interface EditContext {
  messageId: string;
  text: string;
}

interface DmComposerProps {
  convoId: string;
  currentUserId: string;
  replyTo?: ReplyContext | null;
  onCancelReply?: () => void;
  editingMessage?: EditContext | null;
  onCancelEdit?: () => void;
  onMessageSent?: () => void;
}

export function DmComposer({
  convoId,
  currentUserId,
  replyTo,
  onCancelReply,
  editingMessage,
  onCancelEdit,
  onMessageSent,
}: DmComposerProps) {
  const { t } = useLocalization();
  const queryClient = useQueryClient();
  const { metadata, extract, reset: resetMetadata } = useExtractMetadata();

  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const detectedUrlRef = useRef<string | null>(null);
  const inputRef = useRef<TextInput>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Prefill text when editing
  useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.text);
      inputRef.current?.focus();
    }
  }, [editingMessage?.messageId]);

  // Focus when replying
  useEffect(() => {
    if (replyTo) inputRef.current?.focus();
  }, [replyTo]);

  const handleTextChange = useCallback(
    (value: string) => {
      setText(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const match = URL_REGEX.exec(value);
        const url = match?.[0] ?? null;
        if (url && url !== detectedUrlRef.current) {
          detectedUrlRef.current = url;
          void extract(url);
        } else if (!url && detectedUrlRef.current) {
          detectedUrlRef.current = null;
          resetMetadata();
        }
      }, 150);
    },
    [extract, resetMetadata],
  );

  const invalidateQueries = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: queryKeys.people.messages(convoId),
    });
    await queryClient.invalidateQueries({
      queryKey: queryKeys.people.conversations(),
    });
  }, [queryClient, convoId]);

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();

    // Edit mode
    if (editingMessage) {
      if (!trimmed) return;
      setSending(true);
      try {
        const { error } = await supabase
          .from('messages')
          .update({ message_text: trimmed })
          .eq('id', editingMessage.messageId)
          .eq('sender_id', currentUserId);
        if (error) {
          console.error('[DmComposer] edit error:', error);
          return;
        }
        setText('');
        onCancelEdit?.();
        await invalidateQueries();
        onMessageSent?.();
      } finally {
        setSending(false);
      }
      return;
    }

    const hasLink = !!metadata && !!detectedUrlRef.current;
    if (!trimmed && !hasLink) return;

    setSending(true);
    try {
      if (hasLink && metadata) {
        const loggedItemId = await upsertLoggedItem({
          url: metadata.url,
          title: metadata.title ?? metadata.url,
          content_type: metadata.content_type ?? 'article',
          preview_image_url: metadata.preview_image ?? null,
          description: metadata.description ?? null,
          source: metadata.source ?? null,
          read_time: metadata.read_time ?? null,
        });

        const { error } = await supabase.from('messages').insert({
          convo_id: convoId,
          sender_id: currentUserId,
          message_text: trimmed.replace(URL_REGEX, '').trim() || '',
          message_type: 'logged_item',
          logged_item_id: loggedItemId,
          ...(replyTo ? { message_parent_id: replyTo.messageId } : {}),
        });
        if (error) {
          console.error('[DmComposer] send link error:', error);
          return;
        }
        resetMetadata();
        detectedUrlRef.current = null;
      } else {
        const { error } = await supabase.from('messages').insert({
          convo_id: convoId,
          sender_id: currentUserId,
          message_text: trimmed,
          message_type: 'text',
          ...(replyTo ? { message_parent_id: replyTo.messageId } : {}),
        });
        if (error) {
          console.error('[DmComposer] send error:', error);
          return;
        }
      }

      setText('');
      onCancelReply?.();
      await invalidateQueries();
      onMessageSent?.();
    } finally {
      setSending(false);
    }
  }, [
    text,
    editingMessage,
    metadata,
    convoId,
    currentUserId,
    replyTo,
    onCancelReply,
    onCancelEdit,
    onMessageSent,
    invalidateQueries,
    resetMetadata,
  ]);

  const hasContent = text.trim().length > 0 || !!metadata;

  return (
    <VStack className="border-t border-border/60 bg-card px-4 py-2">
      {/* Edit banner */}
      {editingMessage && (
        <HStack className="mb-2 items-center gap-2 rounded-lg border border-border/50 bg-secondary px-3 py-2">
          <View className="w-0.5 self-stretch rounded-full bg-primary" />
          <VStack className="min-w-0 flex-1">
            <Text className="font-sans text-[11px] font-semibold text-primary">
              {t('people.composer_editing')}
            </Text>
            <Text
              numberOfLines={1}
              className="font-sans text-[11px] text-muted-foreground"
            >
              {editingMessage.text}
            </Text>
          </VStack>
          <Pressable
            onPress={() => {
              setText('');
              onCancelEdit?.();
            }}
          >
            <Icon as={X} size="2xs" className="text-muted-foreground" />
          </Pressable>
        </HStack>
      )}

      {/* Reply banner */}
      {replyTo && (
        <HStack className="mb-2 items-center gap-2 rounded-lg border border-border/50 bg-secondary px-3 py-2">
          <View className="w-0.5 self-stretch rounded-full bg-primary" />
          <VStack className="min-w-0 flex-1">
            <Text className="font-sans text-[11px] font-semibold text-primary">
              {replyTo.senderName}
            </Text>
            <Text
              numberOfLines={1}
              className="font-sans text-[11px] text-muted-foreground"
            >
              {replyTo.text}
            </Text>
          </VStack>
          <Pressable onPress={onCancelReply}>
            <Icon as={X} size="2xs" className="text-muted-foreground" />
          </Pressable>
        </HStack>
      )}

      {/* Link preview */}
      {metadata && detectedUrlRef.current && (
        <HStack className="mb-2 items-start overflow-hidden rounded-xl border border-border bg-secondary">
          {metadata.preview_image ? (
            <Image
              source={{ uri: metadata.preview_image }}
              style={{ width: 64, height: 64 }}
            />
          ) : null}
          <VStack className="min-w-0 flex-1 p-2">
            <Text
              numberOfLines={1}
              className="font-sans text-xs font-medium text-foreground"
            >
              {metadata.title ?? detectedUrlRef.current}
            </Text>
            {metadata.source ? (
              <Text
                numberOfLines={1}
                className="font-sans text-[10px] text-muted-foreground"
              >
                {metadata.source}
              </Text>
            ) : null}
          </VStack>
          <Pressable
            onPress={() => {
              detectedUrlRef.current = null;
              resetMetadata();
            }}
            className="p-2"
          >
            <Icon as={X} size="2xs" className="text-muted-foreground" />
          </Pressable>
        </HStack>
      )}

      {/* Input row */}
      <HStack className="items-end gap-2">
        <View className="min-h-[40px] flex-1 justify-center rounded-full border border-border/60 bg-secondary px-3">
          <TextInput
            ref={inputRef}
            value={text}
            onChangeText={handleTextChange}
            placeholder={t('people.composer_placeholder')}
            placeholderTextColor={lightTheme.brandMutedForeground}
            multiline
            style={{
              maxHeight: 128,
              fontFamily: 'DMSans_400Regular',
              fontSize: 14,
              color: lightTheme.brandForeground,
              paddingVertical: 8,
            }}
          />
        </View>
        <Pressable
          onPress={() => void handleSend()}
          disabled={!hasContent || sending}
          className={`h-10 w-10 items-center justify-center rounded-full ${hasContent && !sending ? 'bg-primary' : 'bg-primary/25'}`}
        >
          <Icon as={Send} size="2xs" className="text-primary-foreground" />
        </Pressable>
      </HStack>
    </VStack>
  );
}
