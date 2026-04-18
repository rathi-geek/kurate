import React, { useCallback, useEffect, useRef, useState } from 'react';
import { TextInput } from 'react-native';
import Constants from 'expo-constants';
import { AlertCircle, Link, Plus, X } from 'lucide-react-native';
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
import { decodeHtmlEntities } from '@kurate/utils';
import { useProfile } from '@/hooks/useProfile';
import { useGroupComposer } from '@/hooks/useGroupComposer';
import {
  useExtractMetadata,
  useBumpGroupsList,
  URL_REGEX,
} from '@kurate/hooks';
import type { GroupProfile } from '@kurate/types';
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
  const userId = useAuthStore(s => s.userId) ?? '';
  const accessToken = useAuthStore(s => s.accessToken);
  const { data: profile } = useProfile(userId || undefined);

  const currentUserProfile: GroupProfile | null = profile
    ? {
        id: profile.id,
        display_name:
          [profile.firstName, profile.lastName].filter(Boolean).join(' ') ||
          null,
        avatar_path: profile.avatarPath,
        handle: profile.handle,
      }
    : null;

  const [value, setValue] = useState('');
  const [lockedUrl, setLockedUrl] = useState<string | null>(null);
  const urlTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { isExtracting, metadata, extractionFailed, extract, reset } =
    useExtractMetadata(apiBaseUrl, accessToken);

  const bumpGroupsList = useBumpGroupsList();
  const composer = useGroupComposer({
    groupId,
    currentUserId: userId,
    supabase,
    currentUserProfile,
    onPosted: bumpGroupsList,
  });

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
  const showSend = hasText || !!lockedUrl;

  const handleSubmit = useCallback(() => {
    if (!userId || !showSend) return;

    void composer.handleSend(value.trim(), {
      url: lockedUrl,
      meta: lockedUrl
        ? {
            title: metadata?.title ?? lockedUrl,
            description: metadata?.description ?? null,
            content_type: metadata?.content_type ?? null,
            preview_image: metadata?.preview_image ?? null,
            source: metadata?.source ?? hostOf(lockedUrl),
            read_time: metadata?.read_time ?? null,
          }
        : null,
    });

    setValue('');
    setLockedUrl(null);
    reset();
  }, [userId, showSend, composer, value, lockedUrl, metadata, reset]);

  const showPreview =
    !!lockedUrl || isExtracting || (extractionFailed && !!lockedUrl);

  return (
    <VStack className="gap-2">
      {showPreview && lockedUrl ? (
        <View className="mx-4 overflow-hidden rounded-xl border border-border bg-card">
          <HStack className="items-start gap-3 p-3">
            {/* Thumbnail / loading / failed icon */}
            {isExtracting ? (
              <View
                style={{ width: 48, height: 48 }}
                className="items-center justify-center rounded-md bg-accent"
              >
                <Spinner size="small" />
              </View>
            ) : metadata?.preview_image ? (
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
            ) : (
              <View
                style={{ width: 48, height: 48 }}
                className="items-center justify-center rounded-md bg-accent"
              >
                <Icon
                  as={extractionFailed ? AlertCircle : Link}
                  size="xs"
                  className="text-muted-foreground"
                />
              </View>
            )}

            {/* Text content */}
            <VStack className="min-w-0 flex-1 gap-0.5">
              {isExtracting ? (
                <>
                  <Text className="font-sans text-sm font-medium text-foreground">
                    {t('groups.extracting')}
                  </Text>
                  <Text className="font-mono text-xs text-muted-foreground">
                    {hostOf(lockedUrl)}
                  </Text>
                </>
              ) : extractionFailed && !metadata ? (
                <>
                  <Text
                    numberOfLines={1}
                    className="font-mono text-sm text-muted-foreground"
                  >
                    {lockedUrl}
                  </Text>
                  <Text className="font-sans text-xs text-muted-foreground">
                    {t('groups.extraction_failed')}
                  </Text>
                </>
              ) : (
                <>
                  <Text
                    numberOfLines={2}
                    className="font-sans text-sm font-medium text-foreground"
                  >
                    {decodeHtmlEntities(metadata?.title) ?? lockedUrl}
                  </Text>
                  {metadata?.description ? (
                    <Text
                      numberOfLines={2}
                      className="font-sans text-xs text-muted-foreground"
                    >
                      {metadata.description}
                    </Text>
                  ) : null}
                  <Text className="font-mono text-xs text-muted-foreground">
                    {[
                      metadata?.source ?? hostOf(lockedUrl),
                      metadata?.content_type,
                      metadata?.read_time,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </Text>
                </>
              )}
            </VStack>

            {/* Close button */}
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
          multiline={false}
        />
        {showSend ? (
          <Pressable
            onPress={handleSubmit}
            className="h-8 w-8 items-center justify-center rounded-full bg-primary"
          >
            <Icon as={Plus} size="2xs" className="text-primary-foreground" />
          </Pressable>
        ) : null}
      </HStack>
    </VStack>
  );
}
