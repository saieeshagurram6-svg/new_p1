/**
 * Welcome — Product Bible 06.2.
 * "Explain the product in one screen." Mascot waves; nothing else competes.
 */

import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { MascotStage } from '@/components/Mascot';
import { Body, Button, Display, Screen, Spacer } from '@/components/ui';
import { useAppState } from '@/state/AppProvider';
import { spacing } from '@/theme';

export default function WelcomeScreen() {
  const { reduceMotion } = useAppState();

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.hero}>
        <MascotStage state="happy" size={180} reduceMotion={reduceMotion} />
      </View>

      <View style={styles.copy}>
        <Display center>Hydration, without the nagging.</Display>
        <Spacer size={spacing.md} />
        <Body tone="secondary" center>
          AQUIS watches the day with you and speaks up only when a sip actually makes sense.
        </Body>
      </View>

      <View style={styles.actions}>
        <Button label="Get started" onPress={() => router.push('/(onboarding)/sign-in')} />
        <Button
          label="Already have an account? Sign in"
          variant="ghost"
          onPress={() => router.push('/(onboarding)/sign-in')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    justifyContent: 'space-between',
  },
  // "Large mascot occupying the upper half."
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    paddingHorizontal: spacing.sm,
  },
  actions: {
    paddingTop: spacing.xxl,
    gap: spacing.sm,
  },
});
