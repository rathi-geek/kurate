import React from 'react';
import { Tabs } from 'expo-router';
import { Bell, Users } from 'lucide-react-native';
import BrandArch from '@kurate/icons/brand/brand-arch.svg';

import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { useTheme } from '@/hooks/useTheme';

export default function TabLayout() {
  const { tokens } = useTheme();

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
    </Tabs>
  );
}
