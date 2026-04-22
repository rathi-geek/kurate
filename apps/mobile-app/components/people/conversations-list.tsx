import React, { useCallback, useState } from 'react';
import { FlashList } from '@shopify/flash-list';
import { Plus } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { View } from '@/components/ui/view';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Pressable } from '@/components/ui/pressable';
import { Icon } from '@/components/ui/icon';
import { Skeleton } from '@/components/ui/skeleton';
import { useLocalization } from '@/context';
import { useAuthStore } from '@/store';
import { useDMConversations } from '@/hooks/useDMConversations';
import { useDMUnreadCounts } from '@/hooks/useDMUnreadCounts';
import { ConversationRow } from '@/components/people/conversation-row';
import { FindUserSheet } from '@/components/people/find-user-sheet';
import type { DMConversation } from '@kurate/types';

function ItemSeparator() {
  return <View className="h-2" />;
}

export function ConversationsList() {
  const { t } = useLocalization();
  const router = useRouter();
  const userId = useAuthStore(state => state.userId);
  const { conversations, isLoading, refetch } = useDMConversations();
  const { counts } = useDMUnreadCounts();
  const [findOpen, setFindOpen] = useState(false);

  const handlePress = useCallback(
    (convoId: string) => {
      router.push(`/(tabs)/people/${convoId}`);
    },
    [router],
  );

  const renderItem = useCallback(
    ({ item }: { item: DMConversation }) => (
      <ConversationRow
        conversation={item}
        unreadCount={counts.get(item.id) ?? 0}
        onPress={() => handlePress(item.id)}
      />
    ),
    [counts, handlePress],
  );

  const ListHeader = (
    <HStack className="items-center justify-between px-4 pb-4">
      <Text className="font-sans text-xl font-bold text-foreground">
        {t('people.page_title')}
      </Text>
      <Pressable
        onPress={() => setFindOpen(true)}
        className="flex-row items-center gap-1.5 rounded-full bg-primary px-3 py-1.5"
      >
        <Icon as={Plus} size="2xs" className="text-primary-foreground" />
        <Text className="font-sans text-xs font-medium text-primary-foreground">
          {t('people.new_message_btn')}
        </Text>
      </Pressable>
    </HStack>
  );

  if (isLoading) {
    return (
      <VStack className="gap-3 px-4 pt-6">
        {ListHeader}
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </VStack>
    );
  }

  if (conversations.length === 0) {
    return (
      <VStack className="flex-1 pt-6">
        {ListHeader}
        <VStack className="flex-1 items-center justify-center gap-4 px-8">
          <Text className="text-center font-sans text-sm text-muted-foreground">
            {t('people.empty_title')}
          </Text>
          <Text className="text-center font-sans text-xs text-muted-foreground">
            {t('people.empty_subtitle')}
          </Text>
          <Pressable
            onPress={() => setFindOpen(true)}
            className="mt-2 rounded-full bg-primary px-4 py-2"
          >
            <Text className="font-sans text-sm font-medium text-primary-foreground">
              {t('people.empty_cta')}
            </Text>
          </Pressable>
        </VStack>
        {userId && (
          <FindUserSheet
            open={findOpen}
            onClose={() => setFindOpen(false)}
            currentUserId={userId}
          />
        )}
      </VStack>
    );
  }

  return (
    <VStack className="flex-1 pt-6">
      {ListHeader}
      <FlashList
        data={conversations}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        ItemSeparatorComponent={ItemSeparator}
        onRefresh={refetch}
        refreshing={false}
      />
      {userId && (
        <FindUserSheet
          open={findOpen}
          onClose={() => setFindOpen(false)}
          currentUserId={userId}
        />
      )}
    </VStack>
  );
}
