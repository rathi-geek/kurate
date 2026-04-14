import React, { useCallback, useState } from 'react';
import { ChevronRight } from 'lucide-react-native';
import { View } from '@/components/ui/view';
import { VStack } from '@/components/ui/vstack';
import { Text } from '@/components/ui/text';
import { Pressable } from '@/components/ui/pressable';
import { Avatar } from '@/components/ui/avatar';
import { Icon } from '@/components/ui/icon';
import { Badge, BadgeText } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useLocalization } from '@/context';
import { supabaseUrl } from '@/libs/supabase/client';
import type { GroupMember, GroupRole } from '@kurate/types';
import { MemberActionSheet } from '@/components/groups/member-action-sheet';

interface GroupMembersListProps {
  members: GroupMember[];
  membersLoading: boolean;
  userRole: GroupRole;
  currentUserId: string;
}

const STORAGE_BASE = supabaseUrl
  ? `${supabaseUrl}/storage/v1/object/public/`
  : '';

const ROLE_KEY: Record<GroupRole, string> = {
  owner: 'groups.member_role_owner',
  admin: 'groups.member_role_admin',
  member: 'groups.member_role_member',
};

export function GroupMembersList({
  members,
  membersLoading,
  userRole,
  currentUserId,
}: GroupMembersListProps) {
  const { t } = useLocalization();
  const [selected, setSelected] = useState<GroupMember | null>(null);
  const isOwner = userRole === 'owner';

  const handlePress = useCallback((m: GroupMember) => setSelected(m), []);
  const handleClose = useCallback(() => setSelected(null), []);

  if (membersLoading) {
    return (
      <VStack className="gap-2">
        {[0, 1, 2].map(i => (
          <View
            key={i}
            className="flex-row items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5"
          >
            <Skeleton className="h-10 w-10 rounded-full" />
            <VStack className="flex-1 gap-1">
              <Skeleton className="h-3 w-24 rounded" />
              <Skeleton className="h-2 w-16 rounded" />
            </VStack>
          </View>
        ))}
      </VStack>
    );
  }

  return (
    <>
      <VStack className="gap-2">
        {members.map(m => {
          const role = (m.role ?? 'member') as GroupRole;
          const isSelf = m.user_id === currentUserId;
          const isThisOwner = role === 'owner';
          const tappable = isOwner && !isSelf && !isThisOwner;
          const avatarUrl = m.profile_avatar_path
            ? `${STORAGE_BASE}${m.profile_avatar_path}`
            : null;
          const displayName = m.profile_display_name ?? t('groups.anonymous');

          return (
            <Pressable
              key={m.id}
              onPress={tappable ? () => handlePress(m) : undefined}
              disabled={!tappable}
              className={`flex-row items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5 ${
                tappable ? 'active:bg-accent/40' : ''
              }`}
            >
              <Avatar uri={avatarUrl} name={displayName} size={40} />
              <VStack className="min-w-0 flex-1 gap-0.5">
                <Text
                  numberOfLines={1}
                  className="font-sans text-sm font-medium text-foreground"
                >
                  {displayName}
                </Text>
                {m.profile_handle ? (
                  <Text
                    numberOfLines={1}
                    className="font-mono text-xs text-muted-foreground"
                  >
                    @{m.profile_handle}
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
              {tappable ? (
                <Icon
                  as={ChevronRight}
                  size="xs"
                  className="text-muted-foreground"
                />
              ) : null}
            </Pressable>
          );
        })}
      </VStack>

      <MemberActionSheet
        member={selected}
        open={selected !== null}
        onClose={handleClose}
      />
    </>
  );
}
