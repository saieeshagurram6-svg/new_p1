import { Stack } from 'expo-router';
import React from 'react';

import { color } from '@/theme';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: color.background },
        animation: 'slide_from_right',
        animationDuration: 220,
      }}
    />
  );
}
