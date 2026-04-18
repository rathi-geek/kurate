import React from 'react';
import { ChevronLeft, Library, Newspaper } from 'lucide-react-native';
import { Pressable } from '@/components/ui/pressable';
import { View } from '@/components/ui/view';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Avatar } from '@/components/ui/avatar';
import { Icon } from '@/components/ui/icon';
import { useLocalization } from '@/context';

export type GroupView = 'feed' | 'library';

interface GroupHeaderProps {
  name: string;
  avatarUrl?: string | null;
  onBack: () => void;
  view: GroupView;
  onViewChange: (view: GroupView) => void;
  onOpenInfo?: () => void;
  currentView: GroupView;
}

export function GroupHeader({
  name,
  avatarUrl,
  onBack,
  view,
  onViewChange,
  currentView,
  onOpenInfo,
}: GroupHeaderProps) {
  const { t } = useLocalization();

  return (
    <View
      className={`${currentView === 'feed' ? 'shadow-md' : ''} bg-background px-2 py-2`}
    >
      <HStack className="items-center gap-2">
        <Pressable
          onPress={onBack}
          className="h-9 w-9 items-center justify-center rounded-full active:bg-accent"
          accessibilityLabel={t('common.back')}
        >
          <Icon as={ChevronLeft} size="lg" className="text-foreground" />
        </Pressable>
        <Pressable
          onPress={onOpenInfo}
          disabled={!onOpenInfo}
          className="min-w-0 flex-1 flex-row items-center gap-2 active:opacity-70"
          accessibilityLabel={t('groups.info_aria')}
        >
          <Avatar uri={avatarUrl} name={name} size={32} />
          <Text
            numberOfLines={1}
            className="min-w-0 flex-1 font-sans text-base font-semibold text-foreground"
          >
            {name}
          </Text>
        </Pressable>

        <HStack className="shrink-0 items-center rounded-full border border-border bg-card p-0.5">
          <Pressable
            onPress={() => onViewChange('feed')}
            className={`h-7 w-9 items-center justify-center rounded-full ${
              view === 'feed' ? 'bg-primary' : 'active:bg-accent'
            }`}
            accessibilityLabel={t('groups.show_feed')}
            accessibilityState={{ selected: view === 'feed' }}
          >
            <Icon
              as={Newspaper}
              size="2xs"
              className={
                view === 'feed'
                  ? 'text-primary-foreground'
                  : 'text-muted-foreground'
              }
            />
          </Pressable>
          <Pressable
            onPress={() => onViewChange('library')}
            className={`h-7 w-9 items-center justify-center rounded-full ${
              view === 'library' ? 'bg-primary' : 'active:bg-accent'
            }`}
            accessibilityLabel={t('groups.show_library')}
            accessibilityState={{ selected: view === 'library' }}
          >
            <Icon
              as={Library}
              size="2xs"
              className={
                view === 'library'
                  ? 'text-primary-foreground'
                  : 'text-muted-foreground'
              }
            />
          </Pressable>
        </HStack>
      </HStack>
    </View>
  );
}
