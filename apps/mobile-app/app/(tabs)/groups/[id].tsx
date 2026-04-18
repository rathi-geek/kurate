import React, { useCallback, useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { View } from '@/components/ui/view';
import { VStack } from '@/components/ui/vstack';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertText } from '@/components/ui/alert';
import { useLocalization } from '@/context';
import { supabase } from '@/libs/supabase/client';
import { useAuthStore } from '@/store';
import { useGroupDetail, useGroupMembers, type GroupRow } from '@kurate/hooks';
import { queryKeys } from '@kurate/query';
import { useGroupUnreadCounts } from '@/hooks/useGroupUnreadCounts';
import { GroupHeader, type GroupView } from '@/components/groups/group-header';
import { FeedView } from '@/components/groups/feed-view';
import { LibraryView } from '@/components/groups/library-view';
import { DropComposer } from '@/components/groups/drop-composer';
import { GroupInfoView } from '@/components/groups/group-info-view';

export default function GroupDetailScreen() {
  const { t } = useLocalization();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const groupId = id ?? '';

  const userId = useAuthStore(state => state.userId) ?? '';
  const queryClient = useQueryClient();
  const cachedList = queryClient.getQueryData<GroupRow[]>(
    queryKeys.groups.list(),
  );
  const cachedRow = cachedList?.find(g => g.id === groupId);

  const { data: group, isLoading, error } = useGroupDetail(supabase, groupId);
  const { currentRole } = useGroupMembers(supabase, groupId, userId);
  const { markRead } = useGroupUnreadCounts(userId);

  // Mark as read whenever this group screen mounts (or groupId changes).
  useEffect(() => {
    if (groupId) void markRead(groupId);
  }, [groupId, markRead]);

  const name = group?.group_name ?? cachedRow?.name ?? '';
  const avatarUrl = cachedRow?.avatarUrl ?? null;

  const [view, setView] = useState<GroupView>('feed');
  const [infoOpen, setInfoOpen] = useState(false);

  const handleBack = () => router.back();

  const handleNavigateToFeed = useCallback(() => {
    // TODO: scroll to specific drop once we add per-drop scroll-to support.
    setView('feed');
  }, []);

  const handleOpenInfo = useCallback(() => setInfoOpen(true), []);
  const handleCloseInfo = useCallback(() => setInfoOpen(false), []);

  if (!groupId) {
    return (
      <SafeAreaView
        className="flex-1 bg-background"
        edges={['top', 'left', 'right']}
      >
        <Alert variant="destructive" className="mx-4 my-2">
          <AlertText>{t('groups.error_generic')}</AlertText>
        </Alert>
      </SafeAreaView>
    );
  }

  if (infoOpen && group) {
    return (
      <GroupInfoView
        group={group}
        groupId={groupId}
        groupAvatarUrl={avatarUrl}
        userRole={(currentRole as 'owner' | 'admin' | 'member') ?? 'member'}
        onBack={handleCloseInfo}
      />
    );
  }

  return (
    <SafeAreaView
      className="flex-1 bg-background"
      edges={['top', 'left', 'right']}
    >
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <GroupHeader
          name={name}
          avatarUrl={avatarUrl}
          onBack={handleBack}
          view={view}
          onViewChange={setView}
          onOpenInfo={handleOpenInfo}
          currentView={view}
        />
        <View className="flex-1 ">
          {isLoading && !cachedRow ? (
            <VStack className="flex-1 items-center justify-center">
              <Spinner />
            </VStack>
          ) : error ? (
            <Alert variant="destructive" className="mx-4 my-2">
              <AlertText>{t('groups.error_generic')}</AlertText>
            </Alert>
          ) : view === 'feed' ? (
            <FeedView groupId={groupId} currentRole={currentRole} />
          ) : (
            <LibraryView
              groupId={groupId}
              onNavigateToFeed={handleNavigateToFeed}
            />
          )}
        </View>
        {view === 'feed' ? (
          <View className="bg-background py-2">
            <DropComposer groupId={groupId} />
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
