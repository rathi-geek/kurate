import React, { useCallback, useEffect, useRef } from 'react';
import { FlatList } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import type { Notification } from '@kurate/types';
import { useLocalization } from '@/context';
import { useAuthStore } from '@/store';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationItem } from '@/components/notifications/notification-item';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Text } from '@/components/ui/text';
import { Pressable } from '@/components/ui/pressable';

function SkeletonRow() {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 800 }), -1, true);
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <HStack space="md" className="items-start px-4 py-3">
      <Animated.View
        style={animatedStyle}
        className="h-9 w-9 rounded-full bg-border"
      />
      <VStack space="sm" className="flex-1">
        <Animated.View
          style={animatedStyle}
          className="h-3 w-3/4 rounded bg-border"
        />
        <Animated.View
          style={animatedStyle}
          className="h-3 w-1/2 rounded bg-border"
        />
      </VStack>
    </HStack>
  );
}

function LoadingSkeleton() {
  return (
    <VStack>
      <SkeletonRow />
      <SkeletonRow />
      <SkeletonRow />
    </VStack>
  );
}

function EmptyState() {
  const { t } = useLocalization();
  return (
    <VStack className="flex-1 items-center justify-center gap-4 p-8">
      <Text className="text-center font-sans text-base font-medium text-muted-foreground">
        {t('notifications.empty_title')}
      </Text>
      <Text className="text-center font-sans text-sm text-muted-foreground">
        {t('notifications.empty_subtitle')}
      </Text>
    </VStack>
  );
}

export default function NotificationsScreen() {
  const { t } = useLocalization();
  const userId = useAuthStore(state => state.userId);
  const { notifications, unreadCount, isLoading, markAllRead, markRead } =
    useNotifications(userId);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (unreadCount > 0) {
      timerRef.current = setTimeout(() => {
        void markAllRead();
      }, 1500);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [unreadCount, markAllRead]);

  const renderItem = useCallback(
    ({ item }: { item: Notification }) => (
      <NotificationItem notification={item} markRead={markRead} />
    ),
    [markRead],
  );

  const keyExtractor = useCallback((item: Notification) => item.id, []);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <HStack className="items-center justify-between border-b border-border px-4 py-3">
        <Text className="font-sans text-base font-bold text-foreground">
          {t('notifications.title')}
        </Text>
        {unreadCount > 0 && (
          <Pressable onPress={() => void markAllRead()}>
            <Text className="font-sans text-xs text-muted-foreground">
              {t('notifications.mark_all_read')}
            </Text>
          </Pressable>
        )}
      </HStack>

      {/* Content */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : notifications.length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={{ flexGrow: 1 }}
        />
      )}
    </SafeAreaView>
  );
}
