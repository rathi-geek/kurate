import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { Mail, Search, X, Check } from 'lucide-react-native';
import {
  BottomSheet,
  BottomSheetView,
  BottomSheetScrollView,
  type BottomSheetHandle,
} from '@/components/ui/bottom-sheet';
import { View } from '@/components/ui/view';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Pressable } from '@/components/ui/pressable';
import { Avatar } from '@/components/ui/avatar';
import { Icon } from '@/components/ui/icon';
import { Input, InputField, InputIcon, InputSlot } from '@/components/ui/input';
import { Button, ButtonText, ButtonSpinner } from '@/components/ui/button';
import { useLocalization } from '@/context';
import { supabase, supabaseUrl } from '@/libs/supabase/client';
import { useAuthStore } from '@/store';
import { queryKeys } from '@kurate/query';
import type { GroupRole } from '@kurate/types';

interface InviteMemberSheetProps {
  open: boolean;
  groupId: string;
  memberIds: Set<string>;
  onClose: () => void;
}

interface SearchProfile {
  id: string;
  display_name: string | null;
  avatar_path: string | null;
  handle: string | null;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STORAGE_BASE = supabaseUrl
  ? `${supabaseUrl}/storage/v1/object/public/`
  : '';

export function InviteMemberSheet({
  open,
  groupId,
  memberIds,
  onClose,
}: InviteMemberSheetProps) {
  const { t } = useLocalization();
  const userId = useAuthStore(state => state.userId) ?? '';
  const queryClient = useQueryClient();
  const sheetRef = useRef<BottomSheetHandle>(null);
  const snapPoints = useMemo(() => ['85%'], []);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<SearchProfile[]>([]);
  const [role, setRole] = useState<Exclude<GroupRole, 'owner'>>('member');
  const [adding, setAdding] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  const reset = useCallback(() => {
    setQuery('');
    setResults([]);
    setSelected([]);
    setRole('member');
  }, []);

  useEffect(() => {
    if (open) sheetRef.current?.present();
    else {
      sheetRef.current?.dismiss();
      reset();
    }
  }, [open, reset]);

  // Debounced profile search
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    const trimmed = query.trim();
    if (!trimmed || EMAIL_REGEX.test(trimmed)) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    searchTimerRef.current = setTimeout(async () => {
      const { data } = await supabase
        .from('profiles')
        .select(
          'id, first_name, last_name, handle, avatar:avatar_id(file_path, bucket_name)',
        )
        .or(
          `handle.ilike.%${trimmed}%,first_name.ilike.%${trimmed}%,last_name.ilike.%${trimmed}%`,
        )
        .eq('is_onboarded', true)
        .neq('id', userId)
        .limit(8);
      const mapped: SearchProfile[] = (data ?? []).map(p => {
        const av = p.avatar as {
          file_path: string;
          bucket_name: string;
        } | null;
        return {
          id: p.id,
          display_name:
            [p.first_name, p.last_name].filter(Boolean).join(' ') || null,
          avatar_path: av ? `${av.bucket_name}/${av.file_path}` : null,
          handle: p.handle ?? null,
        };
      });
      setResults(mapped);
      setSearching(false);
    }, 300);
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [query, userId]);

  const isEmail = EMAIL_REGEX.test(query.trim());
  const hasNoResults = !!query.trim() && !searching && results.length === 0;

  const toggleSelect = useCallback(
    (profile: SearchProfile) => {
      if (memberIds.has(profile.id)) return;
      setSelected(prev =>
        prev.some(p => p.id === profile.id)
          ? prev.filter(p => p.id !== profile.id)
          : [...prev, profile],
      );
    },
    [memberIds],
  );

  const handleAddAll = useCallback(async () => {
    if (selected.length === 0) return;
    setAdding(true);
    const { error } = await supabase.from('conversation_members').insert(
      selected.map(p => ({
        convo_id: groupId,
        user_id: p.id,
        role,
        added_by: userId,
      })),
    );
    setAdding(false);
    if (error) {
      Toast.show({ type: 'error', text1: t('groups.error_generic') });
      return;
    }
    void queryClient.invalidateQueries({
      queryKey: queryKeys.groups.members(groupId),
    });
    onClose();
  }, [selected, role, groupId, queryClient, onClose, t]);

  const handleEmailInvite = useCallback(async () => {
    const email = query.trim().toLowerCase();
    if (!isEmail || !userId) return;
    setSendingEmail(true);
    const { error } = await supabase
      .from('group_invites')
      .upsert(
        { group_id: groupId, invited_email: email, invited_by: userId },
        { onConflict: 'group_id,invited_email', ignoreDuplicates: true },
      );
    setSendingEmail(false);
    if (error) {
      Toast.show({ type: 'error', text1: t('groups.error_generic') });
      return;
    }
    void queryClient.invalidateQueries({
      queryKey: queryKeys.groups.invites(groupId),
    });
    Toast.show({ type: 'success', text1: t('groups.invite_sent') });
    setQuery('');
  }, [query, isEmail, userId, groupId, queryClient, t]);

  const renderProfileRow = (profile: SearchProfile) => {
    const alreadyMember = memberIds.has(profile.id);
    const isSelected = selected.some(p => p.id === profile.id);
    const checked = alreadyMember || isSelected;
    const avatarUrl = profile.avatar_path
      ? `${STORAGE_BASE}${profile.avatar_path}`
      : null;
    const name = profile.display_name ?? profile.handle ?? '';
    return (
      <Pressable
        key={profile.id}
        onPress={() => toggleSelect(profile)}
        disabled={alreadyMember}
        className={`flex-row items-center gap-2.5 border-b border-border/50 px-3 py-2.5 active:bg-accent/40 ${
          alreadyMember ? 'opacity-50' : ''
        }`}
      >
        <Avatar uri={avatarUrl} name={name} size={28} />
        <Text
          numberOfLines={1}
          className="min-w-0 flex-1 font-sans text-sm text-foreground"
        >
          {name}
        </Text>
        {profile.handle ? (
          <Text className="font-mono text-xs text-muted-foreground">
            @{profile.handle}
          </Text>
        ) : null}
        <View
          className={`h-4 w-4 items-center justify-center rounded-full ${
            checked
              ? alreadyMember
                ? 'bg-primary/40'
                : 'bg-primary'
              : 'border-2 border-muted-foreground/40'
          }`}
        >
          {checked ? (
            <Icon as={Check} size="2xs" className="text-primary-foreground" />
          ) : null}
        </View>
      </Pressable>
    );
  };

  return (
    <BottomSheet
      ref={sheetRef}
      snapPoints={snapPoints}
      enableDynamicSizing={false}
      onDismiss={onClose}
    >
      <BottomSheetView style={{ flex: 1 }}>
        <VStack className="gap-3 px-4 pb-4 pt-2">
          <Text className="font-sans text-lg font-semibold text-foreground">
            {t('groups.add_member')}
          </Text>

          <Input>
            <InputSlot>
              <InputIcon as={Search} className="text-muted-foreground" />
            </InputSlot>
            <InputField
              value={query}
              onChangeText={setQuery}
              placeholder={t('groups.add_member_placeholder')}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
            />
          </Input>

          {selected.length > 0 ? (
            <View className="flex-row flex-wrap gap-1.5">
              {selected.map(p => (
                <Pressable
                  key={p.id}
                  onPress={() => toggleSelect(p)}
                  className="flex-row items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 active:opacity-70"
                >
                  <Text className="font-sans text-xs text-primary">
                    {p.display_name ?? p.handle ?? '?'}
                  </Text>
                  <Icon as={X} size="2xs" className="text-primary" />
                </Pressable>
              ))}
            </View>
          ) : null}

          <HStack className="items-center gap-2">
            <Text className="font-sans text-xs text-muted-foreground">
              {t('groups.invite_as_role')}
            </Text>
            <Pressable
              onPress={() => setRole('member')}
              className={`rounded-full border px-2.5 py-0.5 ${
                role === 'member'
                  ? 'border-primary bg-primary/10'
                  : 'border-border'
              }`}
            >
              <Text
                className={`font-sans text-xs ${
                  role === 'member' ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {t('groups.member_role_member')}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setRole('admin')}
              className={`rounded-full border px-2.5 py-0.5 ${
                role === 'admin'
                  ? 'border-primary bg-primary/10'
                  : 'border-border'
              }`}
            >
              <Text
                className={`font-sans text-xs ${
                  role === 'admin' ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {t('groups.member_role_admin')}
              </Text>
            </Pressable>
          </HStack>
        </VStack>

        <BottomSheetScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
        >
          {searching ? (
            <Text className="px-1 font-sans text-xs text-muted-foreground">
              {t('groups.searching')}
            </Text>
          ) : null}

          {results.length > 0 ? (
            <View className="overflow-hidden rounded-xl border border-border">
              {results.map(renderProfileRow)}
            </View>
          ) : null}

          {isEmail ? (
            <Pressable
              onPress={handleEmailInvite}
              disabled={sendingEmail}
              className="mt-2 flex-row items-center gap-2 rounded-xl border border-border px-3 py-2.5 active:bg-accent/40"
            >
              <Icon as={Mail} size="xs" className="text-primary" />
              <Text className="flex-1 font-sans text-sm text-foreground">
                {sendingEmail
                  ? t('groups.submitting')
                  : t('groups.invite_by_email', { email: query.trim() })}
              </Text>
              {sendingEmail ? <ButtonSpinner /> : null}
            </Pressable>
          ) : null}

          {hasNoResults && !isEmail ? (
            <Text className="mt-2 px-1 font-sans text-xs text-muted-foreground">
              {t('groups.no_members_found')}
            </Text>
          ) : null}
        </BottomSheetScrollView>

        {selected.length > 0 ? (
          <View className="border-t border-border bg-background px-4 py-3">
            <Button onPress={handleAddAll} disabled={adding}>
              {adding ? (
                <ButtonSpinner />
              ) : (
                <ButtonText>
                  {`Add ${selected.length} ${
                    selected.length === 1
                      ? t('groups.member_role_member')
                      : t('groups.members')
                  }`}
                </ButtonText>
              )}
            </Button>
          </View>
        ) : null}
      </BottomSheetView>
    </BottomSheet>
  );
}
