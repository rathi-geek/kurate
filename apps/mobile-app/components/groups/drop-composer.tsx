import React, { useCallback, useEffect, useRef, useState } from 'react';
import { TextInput } from 'react-native';
import Constants from 'expo-constants';
import { Link, Plus, X } from 'lucide-react-native';
import { useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { View } from '@/components/ui/view';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Pressable } from '@/components/ui/pressable';
import { Icon } from '@/components/ui/icon';
import { Image, resizeMode } from '@/components/ui/fast-image';
import { Spinner } from '@/components/ui/spinner';
import { useLocalization } from '@/context';
import { supabase } from '@/libs/supabase/client';
import { useAuthStore } from '@/store';
import { useExtractMetadata, generateUrlHash, URL_REGEX } from '@kurate/hooks';
import { queryKeys } from '@kurate/query';
import { lightTheme } from '@kurate/theme';

interface DropComposerProps {
  groupId: string;
}

const apiBaseUrl =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ?? '';

const hostOf = (url: string): string => {
  try {
    return new URL(url).host.replace(/^www\./, '');
  } catch {
    return '';
  }
};

export function DropComposer({ groupId }: DropComposerProps) {
  const { t } = useLocalization();
  const queryClient = useQueryClient();
  const userId = useAuthStore(state => state.userId) ?? '';
  const accessToken = useAuthStore(state => state.accessToken);

  const [value, setValue] = useState('');
  const [lockedUrl, setLockedUrl] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const urlTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { isExtracting, metadata, extract, reset } = useExtractMetadata(
    apiBaseUrl,
    accessToken,
  );

  // URL detection — 150ms debounce; on lock, strip URL out of input and run extraction.
  useEffect(() => {
    if (urlTimerRef.current) clearTimeout(urlTimerRef.current);
    urlTimerRef.current = setTimeout(() => {
      const match = value.match(URL_REGEX);
      if (match) {
        const url = match[0];
        if (lockedUrl === url) {
          const deduped = value.replace(url, '').trim();
          if (deduped !== value) setValue(deduped);
          return;
        }
        const remaining = value.replace(url, '').trim();
        setValue(remaining);
        setLockedUrl(url);
        void extract(url);
      }
    }, 150);
    return () => {
      if (urlTimerRef.current) clearTimeout(urlTimerRef.current);
    };
  }, [value, lockedUrl, extract]);

  const dismissPreview = useCallback(() => {
    setLockedUrl(null);
    reset();
  }, [reset]);

  const hasText = value.trim().length > 0;
  const showSend = !isPosting && !isExtracting && (hasText || !!lockedUrl);

  const handleSubmit = useCallback(async () => {
    if (!userId || !showSend) return;
    setIsPosting(true);
    try {
      if (lockedUrl) {
        const url_hash = await generateUrlHash(lockedUrl);
        const { data: logged, error: liError } = await supabase
          .from('logged_items')
          .upsert(
            {
              url: lockedUrl,
              url_hash,
              title: metadata?.title ?? lockedUrl,
              content_type: metadata?.content_type ?? 'article',
              preview_image_url: metadata?.preview_image ?? null,
              description: metadata?.description ?? null,
              raw_metadata: {
                source: metadata?.source ?? null,
                read_time: metadata?.read_time ?? null,
              },
            },
            { onConflict: 'url_hash' },
          )
          .select('id')
          .single();
        if (liError || !logged) throw new Error(liError?.message);

        const note = value.trim();
        const { error: postError } = await supabase.from('group_posts').insert({
          convo_id: groupId,
          logged_item_id: logged.id,
          shared_by: userId,
          note: note || null,
        });
        if (postError) throw new Error(postError.message);
      } else {
        const content = value.trim();
        if (!content) return;
        const { error } = await supabase.from('group_posts').insert({
          convo_id: groupId,
          shared_by: userId,
          content,
        });
        if (error) throw new Error(error.message);
      }

      setValue('');
      setLockedUrl(null);
      reset();
      queryClient.invalidateQueries({
        queryKey: queryKeys.groups.feed(groupId),
      });
      Toast.show({ type: 'success', text1: t('groups.toast_shared') });
    } catch {
      Toast.show({ type: 'error', text1: t('groups.error_generic') });
    } finally {
      setIsPosting(false);
    }
  }, [
    showSend,
    lockedUrl,
    groupId,
    metadata,
    queryClient,
    reset,
    t,
    value,
    userId,
  ]);

  return (
    <VStack className="gap-2">
      {lockedUrl ? (
        <View className="mx-4 overflow-hidden rounded-xl border border-border bg-card">
          <HStack className="gap-3 p-3">
            {metadata?.preview_image ? (
              <View
                style={{ width: 48, height: 48 }}
                className="overflow-hidden rounded-md bg-accent"
              >
                <Image
                  source={{ uri: metadata.preview_image }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode={resizeMode.cover}
                />
              </View>
            ) : null}
            <VStack className="min-w-0 flex-1 gap-0.5">
              {isExtracting ? (
                <Text className="font-sans text-xs text-muted-foreground">
                  {t('groups.extracting')}
                </Text>
              ) : (
                <>
                  {metadata?.title ? (
                    <Text
                      numberOfLines={2}
                      className="font-sans text-sm font-medium text-foreground"
                    >
                      {metadata.title}
                    </Text>
                  ) : null}
                  <Text className="font-mono text-xs text-muted-foreground">
                    {hostOf(lockedUrl)}
                  </Text>
                </>
              )}
            </VStack>
            <Pressable
              onPress={dismissPreview}
              className="h-6 w-6 items-center justify-center rounded-full active:bg-accent"
              accessibilityLabel={t('groups.cancel')}
            >
              <Icon as={X} size="2xs" className="text-muted-foreground" />
            </Pressable>
          </HStack>
        </View>
      ) : null}

      <HStack className="mx-4 h-12 items-center rounded-full bg-card p-2 shadow-lg">
        <Icon
          as={Link}
          size="xs"
          className="ml-1 shrink-0 text-muted-foreground"
        />
        <TextInput
          className="flex-1 bg-transparent px-2 py-1.5 font-sans text-sm text-foreground"
          placeholder={t('groups.composer_placeholder')}
          placeholderTextColor={lightTheme.brandMutedForeground}
          value={value}
          onChangeText={setValue}
          onSubmitEditing={handleSubmit}
          returnKeyType="send"
          editable={!isPosting}
          multiline={false}
        />
        {showSend ? (
          <Pressable
            onPress={handleSubmit}
            className="h-8 w-8 items-center justify-center rounded-full bg-primary"
          >
            {isPosting ? (
              <Spinner className="text-primary-foreground" />
            ) : (
              <Icon as={Plus} size="2xs" className="text-primary-foreground" />
            )}
          </Pressable>
        ) : null}
      </HStack>
    </VStack>
  );
}
