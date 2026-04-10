import React from 'react';
import { Image } from 'react-native';
import { Tabs } from 'expo-router';
import { Bell, User } from 'lucide-react-native';
import BrandArch from '@kurate/icons/brand/brand-arch.svg';

import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { Text } from '@/components/ui/text';
import { View } from '@/components/ui/view';
import { useLocalization } from '@/context';
import { useNotifications } from '@/hooks/useNotifications';
import { useProfile } from '@/hooks/useProfile';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store';

function ProfileTabIcon({ focused }: { focused: boolean }) {
  const { tokens } = useTheme();
  const userId = useAuthStore(state => state.userId);
  const { data: profile } = useProfile(userId ?? undefined);

  const displayName = [profile?.firstName, profile?.lastName]
    .filter(Boolean)
    .join(' ');
  const initial =
    displayName?.[0]?.toUpperCase() ??
    profile?.handle?.[0]?.toUpperCase() ??
    null;

  const ringClass = focused
    ? 'border-2 border-white'
    : 'border border-white/40';

  return (
    <View
      className={`h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-background ${ringClass}`}
    >
      {profile?.avatarUrl ? (
        <Image
          source={{ uri: profile.avatarUrl }}
          className="h-full w-full rounded-full"
          resizeMode="cover"
        />
      ) : initial ? (
        <Text
          className="font-sans font-bold text-primary"
          style={{ fontSize: 9 }}
        >
          {initial}
        </Text>
      ) : (
        <User size={12} color={tokens.brandPrimary} />
      )}
    </View>
  );
}

function NotificationBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <View className="absolute -right-1 -top-1 h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1">
      <Text
        className="font-sans text-[10px] font-bold text-white"
        style={{ lineHeight: 12 }}
      >
        {count > 99 ? '99+' : String(count)}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  const { tokens } = useTheme();
  const { t } = useLocalization();
  const userId = useAuthStore(state => state.userId);
  const { unreadCount } = useNotifications(userId);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: tokens.brandWhite,
        tabBarInactiveTintColor: 'rgba(255,255,255,0.6)',
        tabBarStyle: {
          backgroundColor: tokens.brandPrimary,
        },
        headerShown: useClientOnlyValue(false, true),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ color }: { color: string }) => (
            <BrandArch width={18} height={18} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: t('notifications.title'),
          headerShown: false,
          tabBarIcon: ({ color }: { color: string }) => (
            <View>
              <Bell size={18} color={color} />
              <NotificationBadge count={unreadCount} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="background-task"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="crash-test"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('profile.title'),
          headerShown: false,
          tabBarIcon: ({ focused }: { focused: boolean }) => (
            <ProfileTabIcon focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
