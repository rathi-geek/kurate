import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FlashList } from '@shopify/flash-list';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BottomSheet,
  type BottomSheetHandle,
} from '@/components/ui/bottom-sheet';
import { View } from '@/components/ui/view';
import { VStack } from '@/components/ui/vstack';
import { Text } from '@/components/ui/text';
import { Pressable } from '@/components/ui/pressable';
import { Spinner } from '@/components/ui/spinner';
import { Avatar } from '@/components/ui/avatar';
import { useLocalization } from '@/context';
import { supabase, supabaseUrl } from '@/libs/supabase/client';
import { queryKeys } from '@kurate/query';
import { mediaToUrl } from '@kurate/utils';
import { lightTheme } from '@kurate/theme';

interface SearchProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  handle: string | null;
}

interface FindUserSheetProps {
  open: boolean;
  onClose: () => void;
  currentUserId: string;
}

async function findOrCreateConversation(
  currentUserId: string,
  targetUserId: string,
): Promise<string> {
  // Step 1: current user's conversation memberships
  const { data: myMemberships } = await supabase
    .from('conversation_members')
    .select('convo_id')
    .eq('user_id', currentUserId);

  const myConvoIds = (myMemberships ?? []).map(m => m.convo_id);

  if (myConvoIds.length > 0) {
    // Step 2: shared memberships with target
    const { data: targetMemberships } = await supabase
      .from('conversation_members')
      .select('convo_id')
      .eq('user_id', targetUserId)
      .in('convo_id', myConvoIds);

    const sharedIds = (targetMemberships ?? []).map(m => m.convo_id);

    if (sharedIds.length > 0) {
      // Step 3: filter to DM (is_group=false)
      const { data: dmConvo } = await supabase
        .from('conversations')
        .select('id')
        .in('id', sharedIds)
        .eq('is_group', false)
        .limit(1)
        .maybeSingle();

      if (dmConvo) return dmConvo.id;
    }
  }

  // Create new DM conversation
  const { data: convo, error: convoError } = await supabase
    .from('conversations')
    .insert({ is_group: false })
    .select('id')
    .single();

  if (convoError) throw new Error(convoError.message);

  const { error: membersError } = await supabase
    .from('conversation_members')
    .insert([
      { convo_id: convo.id, user_id: currentUserId, role: 'member' },
      { convo_id: convo.id, user_id: targetUserId, role: 'member' },
    ]);

  if (membersError) throw new Error(membersError.message);

  return convo.id;
}

export function FindUserSheet({
  open,
  onClose,
  currentUserId,
}: FindUserSheetProps) {
  const { t } = useLocalization();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { top: topInset, bottom: bottomInset } = useSafeAreaInsets();
  const sheetRef = useRef<BottomSheetHandle>(null);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const [navigating, setNavigating] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open) {
      sheetRef.current?.present();
      setQuery('');
      setResults([]);
    } else {
      sheetRef.current?.dismiss();
    }
  }, [open]);

  const handleSearch = useCallback(
    (value: string) => {
      setQuery(value);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (!value.trim()) {
        setResults([]);
        setSearching(false);
        return;
      }
      setSearching(true);
      timerRef.current = setTimeout(async () => {
        const trimmed = value.trim();
        const words = trimmed.split(/\s+/);

        const primaryQuery = supabase
          .from('profiles')
          .select(
            'id, first_name, last_name, avatar:avatar_id(file_path, bucket_name), handle',
          )
          .or(
            `handle.ilike.%${trimmed}%,first_name.ilike.%${trimmed}%,last_name.ilike.%${trimmed}%`,
          )
          .eq('is_onboarded', true)
          .neq('id', currentUserId)
          .limit(8);

        const secondaryQuery =
          words.length >= 2
            ? supabase
                .from('profiles')
                .select(
                  'id, first_name, last_name, avatar:avatar_id(file_path, bucket_name), handle',
                )
                .ilike('first_name', `%${words[0]}%`)
                .ilike('last_name', `%${words[words.length - 1]}%`)
                .eq('is_onboarded', true)
                .neq('id', currentUserId)
                .limit(8)
            : Promise.resolve({ data: null });

        const [{ data: primaryData }, { data: secondaryData }] =
          await Promise.all([primaryQuery, secondaryQuery]);

        const seen = new Set<string>();
        const merged = [
          ...(primaryData ?? []),
          ...(secondaryData ?? []),
        ].filter(p => {
          if (seen.has(p.id)) return false;
          seen.add(p.id);
          return true;
        });

        setResults(
          merged.map(p => ({
            id: p.id,
            display_name:
              [p.first_name, p.last_name].filter(Boolean).join(' ') || null,
            avatar_url: p.avatar
              ? mediaToUrl(
                  supabaseUrl,
                  p.avatar as { file_path: string; bucket_name: string },
                )
              : null,
            handle: p.handle ?? null,
          })),
        );
        setSearching(false);
      }, 300);
    },
    [currentUserId],
  );

  const handleSelect = useCallback(
    async (profile: SearchProfile) => {
      setNavigating(profile.id);
      try {
        const convoId = await findOrCreateConversation(
          currentUserId,
          profile.id,
        );
        void queryClient.invalidateQueries({
          queryKey: queryKeys.people.conversations(),
        });
        onClose();
        router.push(`/(tabs)/people/${convoId}`);
      } catch (err) {
        console.error('[FindUserSheet] create conversation error:', err);
      } finally {
        setNavigating(null);
      }
    },
    [currentUserId, queryClient, onClose, router],
  );

  const renderItem = useCallback(
    ({ item }: { item: SearchProfile }) => (
      <Pressable
        onPress={() => void handleSelect(item)}
        disabled={navigating === item.id}
        className="flex-row items-center gap-3 px-4 py-2.5 active:bg-accent"
        style={navigating === item.id ? { opacity: 0.6 } : undefined}
      >
        <Avatar
          uri={item.avatar_url}
          name={item.display_name ?? item.handle}
          size={36}
        />
        <VStack className="min-w-0 flex-1">
          <Text className="font-sans text-sm font-medium text-foreground">
            {item.display_name ?? item.handle ?? t('people.unknown')}
          </Text>
          {item.handle && (
            <Text className="font-sans text-xs text-muted-foreground">
              @{item.handle}
            </Text>
          )}
        </VStack>
        {navigating === item.id && <Spinner />}
      </Pressable>
    ),
    [handleSelect, navigating, t],
  );

  const hasNoResults =
    query.trim().length > 0 && !searching && results.length === 0;

  return (
    <BottomSheet
      ref={sheetRef}
      snapPoints={['60%']}
      enableDynamicSizing={false}
      onDismiss={onClose}
      topInset={topInset}
      bottomInset={bottomInset}
    >
      <VStack className="flex-1 gap-3 px-4 pt-2">
        <Text className="font-sans text-base font-semibold text-foreground">
          {t('people.find_sheet_title')}
        </Text>
        <View className="rounded-xl border border-border bg-secondary px-3">
          <BottomSheetTextInput
            value={query}
            onChangeText={handleSearch}
            placeholder={t('people.find_sheet_search_placeholder')}
            placeholderTextColor={lightTheme.brandMutedForeground}
            autoFocus
            style={{
              height: 40,
              fontFamily: 'DMSans_400Regular',
              fontSize: 14,
              color: lightTheme.brandForeground,
            }}
          />
        </View>

        {searching && (
          <Text className="px-1 font-sans text-xs text-muted-foreground">
            {t('people.find_sheet_searching')}
          </Text>
        )}

        {results.length > 0 && (
          <View className="flex-1 overflow-hidden rounded-xl border border-border">
            <FlashList
              data={results}
              keyExtractor={item => item.id}
              renderItem={renderItem}
            />
          </View>
        )}

        {hasNoResults && (
          <Text className="px-1 font-sans text-xs text-muted-foreground">
            {t('people.find_sheet_no_users')}
          </Text>
        )}
      </VStack>
    </BottomSheet>
  );
}
