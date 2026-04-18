import React, { useMemo, useState } from 'react';
import { ScrollView } from 'react-native';
import { ChevronLeft, Pencil, Plus } from 'lucide-react-native';
import { View } from '@/components/ui/view';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Pressable } from '@/components/ui/pressable';
import { Avatar } from '@/components/ui/avatar';
import { Icon } from '@/components/ui/icon';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { useLocalization } from '@/context';
import { supabase } from '@/libs/supabase/client';
import { useAuthStore } from '@/store';
import { useGroupMembers, useGroupInvites } from '@kurate/hooks';
import type { GroupRole, Tables } from '@kurate/types';
import { GroupMembersList } from '@/components/groups/group-members-list';
import { GroupDangerZone } from '@/components/groups/group-danger-zone';
import { EditGroupInfoSheet } from '@/components/groups/edit-group-info-sheet';
import { InviteMemberSheet } from '@/components/groups/invite-member-sheet';

interface GroupInfoViewProps {
  group: Tables<'conversations'>;
  groupId: string;
  groupAvatarUrl: string | null;
  userRole: GroupRole;
  onBack: () => void;
}

export function GroupInfoView({
  group,
  groupId,
  groupAvatarUrl,
  userRole,
  onBack,
}: GroupInfoViewProps) {
  const { t } = useLocalization();
  const currentUserId = useAuthStore(s => s.userId) ?? '';

  const { members, isLoading: membersLoading } = useGroupMembers(
    supabase,
    groupId,
    currentUserId,
  );
  const { invites } = useGroupInvites(supabase, groupId);

  const isOwner = userRole === 'owner';
  const isAdminOrOwner = isOwner || userRole === 'admin';

  const [editOpen, setEditOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null>(
    groupAvatarUrl,
  );

  const memberIds = useMemo(
    () => new Set(members.map(m => m.user_id)),
    [members],
  );

  const handleEditPress = () => setEditOpen(true);
  const handleEditClose = () => setEditOpen(false);
  const handleAvatarUploaded = (url: string) => setLocalAvatarUrl(url);

  const handleAddMemberPress = () => setInviteOpen(true);
  const handleInviteClose = () => setInviteOpen(false);

  return (
    <SafeAreaView
      className="flex-1 bg-background"
      edges={['top', 'left', 'right']}
    >
      <View className="bg-background px-2 py-2 shadow-md">
        <HStack className="items-center gap-2">
          <Pressable
            onPress={onBack}
            className="h-9 w-9 items-center justify-center rounded-full active:bg-accent"
            accessibilityLabel={t('groups.back_to_feed')}
          >
            <Icon as={ChevronLeft} size="lg" className="text-foreground" />
          </Pressable>
          <Text className="font-sans text-base font-semibold text-foreground">
            {t('groups.info_aria')}
          </Text>
        </HStack>
      </View>

      <View className="flex-1">
        <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
          <VStack className="gap-5 px-4 py-5">
            <HStack className="items-start gap-3">
              <View className="relative">
                <Avatar
                  uri={localAvatarUrl}
                  name={group.group_name ?? 'G'}
                  size={80}
                />
                {isOwner ? (
                  <Pressable
                    onPress={handleEditPress}
                    className="absolute -bottom-0.5 -right-0.5 h-6 w-6 items-center justify-center rounded-full border border-border bg-card shadow-sm active:opacity-70"
                    accessibilityLabel={t('groups.edit_name_aria')}
                  >
                    <Icon
                      as={Pencil}
                      size="2xs"
                      className="text-muted-foreground"
                    />
                  </Pressable>
                ) : null}
              </View>
              <VStack className="min-w-0 flex-1 gap-1 pt-1">
                <Text className="font-sans text-xl font-semibold text-foreground">
                  {group.group_name ?? ''}
                </Text>
                {group.group_description ? (
                  <Text className="font-sans text-sm text-muted-foreground">
                    {group.group_description}
                  </Text>
                ) : null}
              </VStack>
            </HStack>

            <VStack className="gap-2">
              {isAdminOrOwner ? (
                <Pressable
                  onPress={handleAddMemberPress}
                  className="flex-row items-center gap-3 rounded-xl border border-dashed border-border bg-card px-3 py-2.5 active:border-primary"
                  accessibilityLabel={t('groups.add_member')}
                >
                  <View className="h-10 w-10 items-center justify-center rounded-full border-2 border-dashed border-border">
                    <Icon
                      as={Plus}
                      size="xs"
                      className="text-muted-foreground"
                    />
                  </View>
                  <Text className="font-sans text-sm font-medium text-muted-foreground">
                    {t('groups.add_member')}
                  </Text>
                </Pressable>
              ) : null}

              <GroupMembersList
                members={members}
                membersLoading={membersLoading}
                userRole={userRole}
                currentUserId={currentUserId}
              />
            </VStack>

            {isAdminOrOwner && invites.length > 0 ? (
              <VStack className="gap-2">
                <Text className="font-sans text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {t('groups.pending_invites_title')}
                </Text>
                {invites.map(inv => (
                  <View
                    key={inv.id}
                    className="flex-row items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5"
                  >
                    <View className="h-10 w-10 items-center justify-center rounded-full bg-accent">
                      <Text className="font-sans text-base font-semibold text-foreground">
                        {(inv.invited_email[0] ?? '?').toUpperCase()}
                      </Text>
                    </View>
                    <Text
                      numberOfLines={1}
                      className="min-w-0 flex-1 font-sans text-sm text-foreground"
                    >
                      {inv.invited_email}
                    </Text>
                  </View>
                ))}
              </VStack>
            ) : null}
          </VStack>
        </ScrollView>

        <GroupDangerZone
          groupId={groupId}
          groupName={group.group_name ?? ''}
          currentUserId={currentUserId}
          userRole={userRole}
          members={members}
        />
      </View>

      <EditGroupInfoSheet
        open={editOpen}
        groupId={groupId}
        initialName={group.group_name ?? ''}
        initialDescription={group.group_description ?? ''}
        initialAvatarUrl={localAvatarUrl}
        onClose={handleEditClose}
        onAvatarUploaded={handleAvatarUploaded}
      />

      <InviteMemberSheet
        open={inviteOpen}
        groupId={groupId}
        memberIds={memberIds}
        onClose={handleInviteClose}
      />
    </SafeAreaView>
  );
}
