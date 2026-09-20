/**
 * Bottom navigation — Product Bible 05: Home / History / Achievements / Profile.
 */

import { Tabs } from 'expo-router';
import React from 'react';
import type { ColorValue } from 'react-native';

import { Icon, type IconName } from '@/components/Icon';
import { color, typography } from '@/theme';

function tabIcon(name: IconName) {
  return function TabIcon({ color: tint }: { color: ColorValue }) {
    return <Icon name={name} color={String(tint)} size={24} />;
  };
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: color.accentStrong,
        tabBarInactiveTintColor: color.textMuted,
        tabBarStyle: {
          backgroundColor: color.surface,
          borderTopColor: color.border,
          height: 64,
          paddingTop: 6,
          paddingBottom: 8,
        },
        tabBarLabelStyle: typography.micro,
        sceneStyle: { backgroundColor: color.background },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: tabIcon('drop') }} />
      <Tabs.Screen name="history" options={{ title: 'History', tabBarIcon: tabIcon('calendar') }} />
      <Tabs.Screen
        name="achievements"
        options={{ title: 'Achievements', tabBarIcon: tabIcon('medal') }}
      />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: tabIcon('person') }} />
    </Tabs>
  );
}
