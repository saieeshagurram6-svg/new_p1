/**
 * The glass — Product Bible 06.9 and 08.
 *
 * "Water level interpolation, ripple, bubbles, surface wave."
 *
 * The water is a plain view whose height is driven by a spring, with two
 * offset wave paths sliding across its surface. Bubbles are spawned on demand
 * by the parent via the `pulseKey` prop, so logging water reads as a physical
 * event rather than a number changing.
 *
 * Accessibility (08): with Reduce Motion on, the level snaps, the waves stop
 * and the bubbles never mount — the percentage label alone still communicates
 * progress, per "never make animation the only way to understand progress".
 */

import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { color, duration, radius, spring } from '@/theme';

interface GlassProps {
  /** Fill level in [0, 1]. Clamped by the caller via `completionRatio`. */
  progress: number;
  width?: number;
  height?: number;
  reduceMotion?: boolean;
  /**
   * Changing this value triggers the ripple + bubble burst. Pass the entry
   * count or a counter that increments on every log.
   */
  pulseKey?: number;
  children?: React.ReactNode;
}

const WAVE_HEIGHT = 12;
const WALL = 3;
const BUBBLE_COUNT = 5;

export function Glass({
  progress,
  width = 190,
  height = 290,
  reduceMotion = false,
  pulseKey = 0,
  children,
}: GlassProps) {
  const innerWidth = width - WALL * 2;
  const innerHeight = height - WALL * 2;

  const level = useSharedValue(0);
  const waveShift = useSharedValue(0);
  const ripple = useSharedValue(0);
  const burst = useSharedValue(0);

  const clamped = Math.max(0, Math.min(progress, 1));

  useEffect(() => {
    const target = clamped * innerHeight;
    level.value = reduceMotion ? withTiming(target, { duration: 0 }) : withSpring(target, spring.water);
  }, [clamped, innerHeight, reduceMotion, level]);

  useEffect(() => {
    if (reduceMotion) {
      waveShift.value = 0;
      return;
    }
    waveShift.value = 0;
    waveShift.value = withRepeat(
      withTiming(-innerWidth, { duration: 3600, easing: Easing.linear }),
      -1,
      false,
    );
  }, [innerWidth, reduceMotion, waveShift]);

  // Ripple + bubbles on each log. Skipped entirely under Reduce Motion.
  useEffect(() => {
    if (pulseKey === 0 || reduceMotion) return;
    ripple.value = withSequence(
      withTiming(1, { duration: duration.quick, easing: Easing.out(Easing.quad) }),
      withTiming(0, { duration: duration.slow, easing: Easing.in(Easing.quad) }),
    );
    burst.value = 0;
    burst.value = withTiming(1, { duration: 1400, easing: Easing.out(Easing.quad) });
  }, [pulseKey, reduceMotion, ripple, burst]);

  const waterStyle = useAnimatedStyle(() => ({ height: level.value }));

  const waveStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: waveShift.value }],
    opacity: reduceMotion ? 0 : 1,
  }));

  const rippleStyle = useAnimatedStyle(() => ({
    opacity: ripple.value * 0.5,
    transform: [{ scaleX: 1 + ripple.value * 0.08 }],
  }));

  const bubbles = useMemo(
    () =>
      Array.from({ length: BUBBLE_COUNT }, (_, index) => ({
        key: index,
        size: 4 + ((index * 3) % 7),
        left: (innerWidth / (BUBBLE_COUNT + 1)) * (index + 1) - 4,
        delay: index * 90,
      })),
    [innerWidth],
  );

  return (
    <View style={{ width, height }}>
      <View
        style={[
          styles.body,
          { width, height, borderRadius: radius.xl, borderWidth: WALL },
        ]}
      >
        <View style={styles.clip}>
          <Animated.View style={[styles.water, waterStyle]}>
            {/* Surface wave: two offset copies so the loop never shows a seam. */}
            <Animated.View style={[styles.waveRow, { width: innerWidth * 2 }, waveStyle]}>
              <Wave width={innerWidth} />
              <Wave width={innerWidth} />
            </Animated.View>
            <View style={styles.waterBody} />
            <Animated.View style={[styles.ripple, rippleStyle]} />
            {!reduceMotion &&
              bubbles.map((bubble) => (
                <Bubble
                  key={`${pulseKey}-${bubble.key}`}
                  progressValue={burst}
                  size={bubble.size}
                  left={bubble.left}
                  delay={bubble.delay}
                  travel={innerHeight * clamped}
                />
              ))}
          </Animated.View>
        </View>

        {/* Highlight along the left wall — reads as glass rather than a tube. */}
        <View style={styles.highlight} pointerEvents="none" />
      </View>

      {children ? (
        <View style={styles.overlay} pointerEvents="none">
          {children}
        </View>
      ) : null}
    </View>
  );
}

function Wave({ width }: { width: number }) {
  return (
    <Svg width={width} height={WAVE_HEIGHT} viewBox={`0 0 ${width} ${WAVE_HEIGHT}`}>
      <Path
        d={`M0 ${WAVE_HEIGHT / 2}
            Q ${width * 0.25} 0 ${width * 0.5} ${WAVE_HEIGHT / 2}
            T ${width} ${WAVE_HEIGHT / 2}
            V ${WAVE_HEIGHT} H 0 Z`}
        fill={color.waterTop}
      />
    </Svg>
  );
}

interface BubbleProps {
  progressValue: SharedValue<number>;
  size: number;
  left: number;
  delay: number;
  travel: number;
}

function Bubble({ progressValue, size, left, delay, travel }: BubbleProps) {
  const rise = useSharedValue(0);

  useEffect(() => {
    rise.value = 0;
    rise.value = withDelay(delay, withTiming(1, { duration: 1100, easing: Easing.out(Easing.quad) }));
  }, [delay, rise]);

  const style = useAnimatedStyle(() => ({
    opacity: (1 - rise.value) * 0.7 * progressValue.value,
    transform: [{ translateY: -rise.value * Math.max(travel - size, 20) }],
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
  body: {
    borderColor: color.accentSoft,
    backgroundColor: color.surface,
    overflow: 'hidden',
  },
  clip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
  },
  water: {
    width: '100%',
    justifyContent: 'flex-start',
  },
  waveRow: {
    flexDirection: 'row',
    height: WAVE_HEIGHT,
    marginTop: -WAVE_HEIGHT / 2,
  },
  waterBody: {
    flex: 1,
    backgroundColor: color.waterBody,
  },
  ripple: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: color.surface,
  },
  bubble: {
    position: 'absolute',
    bottom: 6,
    backgroundColor: color.surface,
  },
  highlight: {
    position: 'absolute',
    top: 18,
    left: 16,
    width: 8,
    height: 70,
    borderRadius: 4,
    backgroundColor: color.surface,
    opacity: 0.55,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
