/**
 * Splash — Product Bible 06.1.
 *
 * "Load local database, goal state and notification state before navigation.
 * Animation duration: ~800–1400 ms; never block unnecessarily."
 *
 * The minimum dwell and the data load run concurrently: whichever finishes last
 * decides when we route, so a warm start is not padded out artificially and a
 * cold start never flashes an unstyled screen.
 */

import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Mascot } from '@/components/Mascot';
import { Body, Button, Screen, Title } from '@/components/ui';
import { useAppState } from '@/state/AppProvider';
import { color, duration, spacing } from '@/theme';

const MIN_SPLASH_MS = 900;

export default function SplashScreen() {
  const { ready, bootstrapError, profile, activeGoal, refresh, reduceMotion } = useAppState();
  const [dwellDone, setDwellDone] = useState(false);
  const navigated = useRef(false);

  const logoOpacity = useSharedValue(0);
  const logoLift = useSharedValue(12);
  const ring = useSharedValue(0);

  useEffect(() => {
    const timer = setTimeout(() => setDwellDone(true), MIN_SPLASH_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      logoOpacity.value = 1;
      logoLift.value = 0;
      return;
    }
    logoOpacity.value = withTiming(1, { duration: duration.slow, easing: Easing.out(Easing.quad) });
    logoLift.value = withTiming(0, { duration: duration.slow, easing: Easing.out(Easing.quad) });
    // Water ripple under the wordmark.
    ring.value = withDelay(
      240,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1500, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 0 }),
        ),
        -1,
        false,
      ),
    );
  }, [reduceMotion, logoOpacity, logoLift, ring]);

  useEffect(() => {
    if (!ready || !dwellDone || bootstrapError || navigated.current) return;
    navigated.current = true;

    if (!profile) {
      router.replace('/(onboarding)/welcome');
    } else if (!activeGoal) {
      // Signed in, but no open goal period — either the first run or the last
      // period has elapsed and was closed. Resume at goal setup (06.4).
      router.replace('/(onboarding)/goal');
    } else {
      router.replace('/(tabs)');
    }
  }, [ready, dwellDone, bootstrapError, profile, activeGoal]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ translateY: logoLift.value }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: (1 - ring.value) * 0.35,
    transform: [{ scale: 0.6 + ring.value * 1.1 }],
  }));

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.glow} pointerEvents="none" />

      <View style={styles.stack}>
        {!reduceMotion ? <Animated.View style={[styles.ring, ringStyle]} pointerEvents="none" /> : null}
        <Mascot state="idle" size={132} reduceMotion={reduceMotion} />
        <Animated.View style={logoStyle}>
          <Title style={styles.wordmark}>AQUIS</Title>
          <Body tone="secondary" center>
            Hydration, without the nagging.
          </Body>
        </Animated.View>
      </View>

      {bootstrapError ? (
        <View style={styles.error}>
          <Body tone="secondary" center>
            AQUIS could not open its local storage.
          </Body>
          <Body tone="muted" center style={styles.errorDetail}>
            {bootstrapError}
          </Body>
          <Button
            label="Try again"
            variant="secondary"
            onPress={() => {
              navigated.current = false;
              void refresh();
            }}
          />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  // "Background is almost white with a soft blue radial glow" (06.1).
  glow: {
    position: 'absolute',
    width: 420,
    height: 420,
    borderRadius: 210,
    backgroundColor: color.accentWash,
    opacity: 0.75,
  },
  stack: {
    alignItems: 'center',
    gap: spacing.lg,
  },
  ring: {
    position: 'absolute',
    top: 24,
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 2,
    borderColor: color.accentSoft,
  },
  wordmark: {
    textAlign: 'center',
    letterSpacing: 6,
  },
  error: {
    position: 'absolute',
    bottom: spacing.xxl,
    left: 0,
    right: 0,
    gap: spacing.md,
  },
  errorDetail: {
    marginBottom: spacing.sm,
  },
});
