import React, { useCallback, useState } from 'react';
import { Alert as RNAlert } from 'react-native';
import { LogOut, Trash2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { View } from '@/components/ui/view';
import { VStack } from '@/components/ui/vstack';
import { Text } from '@/components/ui/text';
import { Pressable } from '@/components/ui/pressable';
import { Icon } from '@/components/ui/icon';
import { useLocalization } from '@/context';
import { supabase } from '@/libs/supabase/client';
import { queryKeys } from '@kurate/query';
import type { GroupMember, GroupRole } from '@kurate/types';

interface GroupDangerZoneProps {
  groupId: string;
  groupName: string;
  currentUserId: string;
  userRole: GroupRole;
  members: GroupMember[];
}

export function GroupDangerZone({
  groupId,
  groupName,
  currentUserId,
  userRole,
  members,
}: GroupDangerZoneProps) {
  const { t } = useLocalization();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState<'leave' | 'delete' | null>(null);

  const isOwner = userRole === 'owner';
  const others = members.filter(m => m.user_id !== currentUserId);
  const successor =
    isOwner && others.length > 0
      ? (others.find(m => m.role === 'admin') ??
        others
          .slice()
          .sort((a, b) => a.joined_at.localeCompare(b.joined_at))[0])
      : null;

  const leaveSubtitle = isOwner
    ? successor
      ? t('groups.leave_group_subtitle_transfer', {
          successor: successor.profile_display_name ?? t('groups.anonymous'),
        })
      : t('groups.leave_group_subtitle_last')
    : t('groups.leave_group_subtitle_member');

  const leave = useCallback(async () => {
    setBusy('leave');
    try {
      if (isOwner) {
        if (others.length === 0) {
          const { error } = await supabase
            .from('conversations')
            .delete()
            .eq('id', groupId);
          if (error) throw error;
        } else {
          const suc =
            others.find(m => m.role === 'admin') ??
            others
              .slice()
              .sort((a, b) => a.joined_at.localeCompare(b.joined_at))[0];
          const { error: tErr } = await supabase
            .from('conversation_members')
            .update({ role: 'owner' })
            .eq('id', suc.id);
          if (tErr) throw tErr;
          const { error: lErr } = await supabase
            .from('conversation_members')
            .delete()
            .eq('convo_id', groupId)
            .eq('user_id', currentUserId);
          if (lErr) throw lErr;
        }
      } else {
        const { error } = await supabase
          .from('conversation_members')
          .delete()
          .eq('convo_id', groupId)
          .eq('user_id', currentUserId);
        if (error) throw error;
      }
      queryClient.removeQueries({ queryKey: queryKeys.groups.detail(groupId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.groups.list() });
      router.replace('/(tabs)/groups' as never);
    } catch {
      Toast.show({ type: 'error', text1: t('groups.error_generic') });
    } finally {
      setBusy(null);
    }
  }, [isOwner, others, groupId, currentUserId, queryClient, router, t]);

  const handleDelete = useCallback(async () => {
    setBusy('delete');
    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', groupId);
      if (error) throw error;
      queryClient.removeQueries({ queryKey: queryKeys.groups.detail(groupId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.groups.list() });
      router.replace('/(tabs)/groups' as never);
    } catch {
      Toast.show({ type: 'error', text1: t('groups.error_generic') });
    } finally {
      setBusy(null);
    }
  }, [groupId, queryClient, router, t]);

  const confirmLeave = useCallback(() => {
    RNAlert.alert(t('groups.leave_group'), `${groupName}\n\n${leaveSubtitle}`, [
      { text: t('groups.danger_confirm_cancel'), style: 'cancel' },
      {
        text: t('groups.danger_confirm_leave'),
        style: 'destructive',
        onPress: () => void leave(),
      },
    ]);
  }, [t, groupName, leaveSubtitle, leave]);

  const confirmDelete = useCallback(() => {
    RNAlert.alert(
      t('groups.delete_group'),
      `${groupName}\n\n${t('groups.delete_group_subtitle')}`,
      [
        { text: t('groups.danger_confirm_cancel'), style: 'cancel' },
        {
          text: t('groups.danger_confirm_delete'),
          style: 'destructive',
          onPress: () => void handleDelete(),
        },
      ],
    );
  }, [t, groupName, handleDelete]);

  return (
    <View className="border-t border-destructive/20 px-4 py-4">
      <Text className="mb-3 font-sans text-[11px] font-semibold uppercase tracking-widest text-destructive/70">
        {t('groups.danger_zone_label')}
      </Text>

      <VStack className="overflow-hidden rounded-xl border border-destructive/25 bg-destructive/5">
        <Pressable
          onPress={confirmLeave}
          disabled={busy !== null}
          className="flex-row items-center gap-3 px-4 py-3 active:bg-destructive/10"
        >
          <Icon as={LogOut} size="xs" className="text-destructive/70" />
          <VStack className="min-w-0 flex-1">
            <Text className="font-sans text-sm font-medium text-destructive">
              {busy === 'leave' ? t('groups.leaving') : t('groups.leave_group')}
            </Text>
            <Text className="font-sans text-xs text-muted-foreground">
              {isOwner
                ? t('groups.leave_group_hint_owner')
                : t('groups.leave_group_hint_member')}
            </Text>
          </VStack>
        </Pressable>

        {isOwner ? (
          <>
            <View className="mx-4 h-px bg-destructive/15" />
            <Pressable
              onPress={confirmDelete}
              disabled={busy !== null}
              className="flex-row items-center gap-3 px-4 py-3 active:bg-destructive/10"
            >
              <Icon as={Trash2} size="xs" className="text-destructive/70" />
              <VStack className="min-w-0 flex-1">
                <Text className="font-sans text-sm font-medium text-destructive">
                  {busy === 'delete'
                    ? t('groups.deleting')
                    : t('groups.delete_group')}
                </Text>
                <Text className="font-sans text-xs text-muted-foreground">
                  {t('groups.delete_group_hint')}
                </Text>
              </VStack>
            </Pressable>
          </>
        ) : null}
      </VStack>
    </View>
  );
}
