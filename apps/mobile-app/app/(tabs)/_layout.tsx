import React from 'react';
import { Image } from 'react-native';
import { Tabs } from 'expo-router';
import { Bell, User, Users } from 'lucide-react-native';
import BrandArch from '@kurate/icons/brand/brand-arch.svg';

import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { Text } from '@/components/ui/text';
import { View } from '@/components/ui/view';
import { useLocalization } from '@/context';
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

export default function TabLayout() {
  const { tokens } = useTheme();
  const { t } = useLocalization();

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
        name="background-task"
        options={{
          title: 'Background Task',
          tabBarIcon: ({ color }: { color: string }) => (
            <Bell size={18} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="crash-test"
        options={{
          title: 'Crash Test',
          tabBarIcon: ({ color }: { color: string }) => (
            <Users size={18} color={color} />
          ),
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
