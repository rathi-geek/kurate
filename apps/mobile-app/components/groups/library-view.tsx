import React, { useState } from 'react';
import { View } from '@/components/ui/view';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Pressable } from '@/components/ui/pressable';
import { useLocalization } from '@/context';
import { LibraryRecommendedGrid } from '@/components/groups/library-recommended-grid';
import { LibraryAllSharedGrid } from '@/components/groups/library-all-shared-grid';

type LibraryTab = 'recommended' | 'all';

interface LibraryViewProps {
  groupId: string;
  onNavigateToFeed?: (dropId: string) => void;
}

export function LibraryView({ groupId, onNavigateToFeed }: LibraryViewProps) {
  const { t } = useLocalization();
  const [tab, setTab] = useState<LibraryTab>('recommended');

  return (
    <VStack className="flex-1">
      <HStack className="m-2 mt-0 border-b border-border">
        <Pressable
          onPress={() => setTab('recommended')}
          className="relative flex-1 items-center py-3"
        >
          <Text
            className={`font-sans text-sm ${
              tab === 'recommended'
                ? 'font-semibold text-foreground'
                : 'text-muted-foreground'
            }`}
          >
            {t('groups.must_read')}
          </Text>
          {tab === 'recommended' ? (
            <View className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          ) : null}
        </Pressable>
        <Pressable
          onPress={() => setTab('all')}
          className="relative flex-1 items-center py-3"
        >
          <Text
            className={`font-sans text-sm ${
              tab === 'all'
                ? 'font-semibold text-foreground'
                : 'text-muted-foreground'
            }`}
          >
            {t('groups.all_shared')}
          </Text>
          {tab === 'all' ? (
            <View className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          ) : null}
        </Pressable>
      </HStack>

      {tab === 'recommended' ? (
        <LibraryRecommendedGrid groupId={groupId} onPress={onNavigateToFeed} />
      ) : (
        <LibraryAllSharedGrid groupId={groupId} onPress={onNavigateToFeed} />
      )}
    </VStack>
  );
}
