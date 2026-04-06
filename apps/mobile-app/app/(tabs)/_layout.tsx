import React from 'react';
import { StyleSheet } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import { Bookmark } from 'lucide-react-native';

import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { useTheme } from '@/hooks/useTheme';

const styles = StyleSheet.create({
  tabBarIcon: {
    marginBottom: -3,
  },
});

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={styles.tabBarIcon} {...props} />;
}

export default function TabLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#ffffff',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.6)',
        tabBarStyle: {
          backgroundColor: colors.BrandPrimary,
        },
        headerShown: useClientOnlyValue(false, true),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Vault',
          headerShown: false,
          tabBarIcon: ({ color }: { color: string }) => (
            <Bookmark size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="background-task"
        options={{
          title: 'Background Task',
          tabBarIcon: ({ color }: { color: string }) => (
            <TabBarIcon name="code" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="crash-test"
        options={{
          title: 'Crash Test',
          tabBarIcon: ({ color }: { color: string }) => (
            <TabBarIcon name="bug" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
