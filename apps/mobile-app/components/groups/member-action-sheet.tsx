import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import Toast from 'react-native-toast-message';
import { useQueryClient } from '@tanstack/react-query';
import { PenLine, UserX } from 'lucide-react-native';
import {
  BottomSheet,
  BottomSheetView,
  type BottomSheetHandle,
} from '@/components/ui/bottom-sheet';
import { View } from '@/components/ui/view';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Pressable } from '@/components/ui/pressable';
import { Avatar } from '@/components/ui/avatar';
import { Icon } from '@/components/ui/icon';
import { Badge, BadgeText } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { useLocalization } from '@/context';
import { supabase, supabaseUrl } from '@/libs/supabase/client';
import { queryKeys } from '@kurate/query';
import type { GroupMember, GroupRole } from '@kurate/types';

interface MemberActionSheetProps {
  member: GroupMember | null;
  open: boolean;
  onClose: () => void;
}

const STORAGE_BASE = supabaseUrl
  ? `${supabaseUrl}/storage/v1/object/public/`
  : '';

const ROLE_KEY: Record<GroupRole, string> = {
  owner: 'groups.member_role_owner',
  admin: 'groups.member_role_admin',
  member: 'groups.member_role_member',
};

export function MemberActionSheet({
  member,
  open,
  onClose,
}: MemberActionSheetProps) {
  const { t } = useLocalization();
  const queryClient = useQueryClient();
  const sheetRef = useRef<BottomSheetHandle>(null);
  const snapPoints = useMemo(() => ['55%'], []);
  const [loading, setLoading] = useState<'role' | 'remove' | null>(null);

  useEffect(() => {
    if (open) sheetRef.current?.present();
    else sheetRef.current?.dismiss();
  }, [open]);

  const role = (member?.role ?? 'member') as GroupRole;
  const name =
    member?.profile_display_name ??
    member?.profile_handle ??
    t('groups.member_fallback_name');
  const avatarUrl = member?.profile_avatar_path
    ? `${STORAGE_BASE}${member.profile_avatar_path}`
    : null;
  const isAdmin = role === 'admin';

  const handleRoleChange = useCallback(async () => {
    if (!member) return;
    const newRole: GroupRole = isAdmin ? 'member' : 'admin';
    setLoading('role');
    const { error } = await supabase
      .from('conversation_members')
      .update({ role: newRole })
      .eq('id', member.id);
    setLoading(null);
    if (error) {
      Toast.show({
        type: 'error',
        text1: t('groups.toast_member_role_failed'),
      });
      return;
    }
    void queryClient.invalidateQueries({
      queryKey: queryKeys.groups.members(member.convo_id),
    });
    Toast.show({
      type: 'success',
      text1:
        newRole === 'admin'
          ? t('groups.toast_member_now_admin', { name })
          : t('groups.toast_member_now_member', { name }),
    });
    onClose();
  }, [member, isAdmin, name, t, queryClient, onClose]);

  const handleRemove = useCallback(async () => {
    if (!member) return;
    setLoading('remove');
    const { error } = await supabase
      .from('conversation_members')
      .delete()
      .eq('id', member.id);
    setLoading(null);
    if (error) {
      Toast.show({
        type: 'error',
        text1: t('groups.toast_member_remove_failed'),
      });
      return;
    }
    void queryClient.invalidateQueries({
      queryKey: queryKeys.groups.members(member.convo_id),
    });
    Toast.show({
      type: 'success',
      text1: t('groups.toast_member_removed', { name }),
    });
    onClose();
  }, [member, name, t, queryClient, onClose]);

  if (!member) return null;

  return (
    <BottomSheet
      ref={sheetRef}
      snapPoints={snapPoints}
      enableDynamicSizing={false}
      onDismiss={onClose}
    >
      <BottomSheetView>
        <VStack className="gap-3 px-4 pb-8 pt-2">
          <Text className="font-sans text-base font-semibold text-foreground">
            {t('groups.member_action_title')}
          </Text>

          <HStack className="items-center gap-3 rounded-xl border border-border bg-secondary px-3 py-2.5">
            <Avatar uri={avatarUrl} name={name} size={36} />
            <VStack className="min-w-0 flex-1">
              <Text
                numberOfLines={1}
                className="font-sans text-sm font-medium text-foreground"
              >
                {name}
              </Text>
              {member.profile_handle ? (
                <Text className="font-mono text-xs text-muted-foreground">
                  @{member.profile_handle}
                </Text>
              ) : null}
            </VStack>
            <Badge variant="muted">
              <BadgeText
                variant="muted"
                className="font-mono text-[10px] uppercase"
              >
                {t(ROLE_KEY[role])}
              </BadgeText>
            </Badge>
          </HStack>

          <Pressable
            onPress={() => void handleRoleChange()}
            disabled={loading !== null}
            className="flex-row items-center gap-3 rounded-xl border border-border px-4 py-3 active:bg-accent/40"
          >
            <View className="h-8 w-8 items-center justify-center rounded-full bg-accent">
              {loading === 'role' ? (
                <Spinner className="text-primary" />
              ) : (
                <Icon as={PenLine} size="xs" className="text-primary" />
              )}
            </View>
            <VStack className="min-w-0 flex-1">
              <Text className="font-sans text-sm font-medium text-foreground">
                {loading === 'role'
                  ? t('groups.member_action_updating')
                  : isAdmin
                    ? t('groups.member_action_revoke_admin_label')
                    : t('groups.member_action_make_admin_label')}
              </Text>
              <Text className="font-sans text-xs text-muted-foreground">
                {isAdmin
                  ? t('groups.member_action_revoke_admin_desc')
                  : t('groups.member_action_make_admin_desc')}
              </Text>
            </VStack>
          </Pressable>

          <Pressable
            onPress={() => void handleRemove()}
            disabled={loading !== null}
            className="flex-row items-center gap-3 rounded-xl border border-destructive/25 px-4 py-3 active:bg-destructive/5"
          >
            <View className="h-8 w-8 items-center justify-center rounded-full bg-destructive/10">
              {loading === 'remove' ? (
                <Spinner className="text-destructive" />
              ) : (
                <Icon as={UserX} size="xs" className="text-destructive" />
              )}
            </View>
            <VStack className="min-w-0 flex-1">
              <Text className="font-sans text-sm font-medium text-destructive">
                {loading === 'remove'
                  ? t('groups.member_action_removing')
                  : t('groups.member_action_remove_title')}
              </Text>
              <Text className="font-sans text-xs text-muted-foreground">
                {t('groups.member_action_remove_desc')}
              </Text>
            </VStack>
          </Pressable>
        </VStack>
      </BottomSheetView>
    </BottomSheet>
  );
}
