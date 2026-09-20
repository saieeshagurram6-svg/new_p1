/**
 * Daily-complete celebration — Product Bible 06.11.
 *
 * "Confetti/bubbles should be restrained; 1–2 seconds maximum."
 *
 * Bubbles, not confetti — the celebration stays inside the water metaphor. It
 * is purely decorative and never blocks input, which matters for the MVP
 * acceptance criterion "animations never prevent the user from completing core
 * actions" (20).
 */

import React, { useEffect } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { duration, palette } from '@/theme';

const BUBBLES = 14;

export function Celebration({
  active,
  reduceMotion = false,
}: {
  active: boolean;
  reduceMotion?: boolean;
}) {
  const { width, height } = useWindowDimensions();

  if (!active || reduceMotion) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {Array.from({ length: BUBBLES }, (_, index) => (
        <Bubble
          key={index}
          index={index}
          screenWidth={width}
          screenHeight={height}
        />
      ))}
    </View>
  );
}

function Bubble({
  index,
  screenWidth,
  screenHeight,
}: {
  index: number;
  screenWidth: number;
  screenHeight: number;
}) {
  const progress = useSharedValue(0);

  // Deterministic spread: no randomness means no re-render jitter.
  const size = 8 + ((index * 5) % 14);
  const left = ((index + 1) / (BUBBLES + 1)) * screenWidth - size / 2;
  const drift = index % 2 === 0 ? 18 : -18;
  const delay = (index % 5) * 70;

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(1, { duration: duration.celebration, easing: Easing.out(Easing.quad) }),
    );
  }, [delay, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: progress.value < 0.15 ? progress.value / 0.15 : 1 - progress.value,
    transform: [
      { translateY: -progress.value * screenHeight * 0.75 },
      { translateX: Math.sin(progress.value * Math.PI * 2) * drift },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.bubble,
        { width: size, height: size, borderRadius: size / 2, left },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  bubble: {
    position: 'absolute',
    bottom: 40,
    backgroundColor: palette.water300,
    opacity: 0.8,
  },
});
