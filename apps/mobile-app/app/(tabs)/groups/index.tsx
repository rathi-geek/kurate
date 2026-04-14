import React, { useCallback, useState } from 'react';
import { FlashList } from '@shopify/flash-list';
import { Plus } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigationLock } from '@/hooks/useNavigationLock';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Text } from '@/components/ui/text';
import { Pressable } from '@/components/ui/pressable';
import { Skeleton } from '@/components/ui/skeleton';
import { Icon } from '@/components/ui/icon';
import { Alert, AlertText } from '@/components/ui/alert';
import { useLocalization } from '@/context';
import { supabase, supabaseUrl } from '@/libs/supabase/client';
import { useAuthStore } from '@/store';
import { fetchUserGroups, type GroupRow as GroupRowType } from '@kurate/hooks';
import { queryKeys } from '@kurate/query';
import { useGroupUnreadCounts } from '@/hooks/useGroupUnreadCounts';
import { GroupRow } from '@/components/groups/group-row';
import { GroupsEmptyState } from '@/components/groups/groups-empty-state';
import { CreateGroupSheet } from '@/components/groups/create-group-sheet';

export default function GroupsScreen() {
  const { t } = useLocalization();
  const { push } = useNavigationLock();
  const userId = useAuthStore(state => state.userId) ?? '';
  const [createOpen, setCreateOpen] = useState(false);

  const {
    data: groups = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.groups.list(),
    queryFn: () => fetchUserGroups(supabase, supabaseUrl),
  });

  const { getCount } = useGroupUnreadCounts(userId);

  const handlePressRow = useCallback(
    (id: string) => {
      push(`/groups/${id}`);
    },
    [push],
  );

  const renderItem = useCallback(
    ({ item }: { item: GroupRowType }) => (
      <GroupRow
        group={item}
        onPress={handlePressRow}
        unreadCount={getCount(item.id)}
      />
    ),
    [handlePressRow, getCount],
  );

  return (
    <SafeAreaView
      className="flex-1 bg-background"
      edges={['top', 'left', 'right']}
    >
      <HStack className="items-center justify-between px-4 py-3">
        <Text className="font-sans text-xl font-bold text-foreground">
          {t('groups.my_groups_title')}
        </Text>
        <Pressable
          onPress={() => setCreateOpen(true)}
          className="flex-row items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 active:opacity-80"
        >
          <Icon as={Plus} size="2xs" className="text-primary-foreground" />
          <Text className="font-sans text-xs font-medium text-primary-foreground">
            {t('groups.create_submit')}
          </Text>
        </Pressable>
      </HStack>

      {isLoading ? (
        <VStack className="gap-3 px-4 pt-2">
          {[0, 1, 2, 3].map(i => (
            <Skeleton key={i} className="h-[72px] w-full rounded-xl" />
          ))}
        </VStack>
      ) : error ? (
        <Alert variant="destructive" className="mx-4 my-2">
          <AlertText>{t('groups.error_generic')}</AlertText>
        </Alert>
      ) : groups.length === 0 ? (
        <GroupsEmptyState onCreate={() => setCreateOpen(true)} />
      ) : (
        <FlashList
          data={groups}
          keyExtractor={g => g.id}
          renderItem={renderItem}
          onRefresh={refetch}
          refreshing={isLoading}
        />
      )}

      <CreateGroupSheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
    </SafeAreaView>
  );
}
