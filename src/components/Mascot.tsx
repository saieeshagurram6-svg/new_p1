/**
 * The mascot — Product Bible 07.
 *
 * One water-based character, drawn once as a droplet and expressed through
 * face and pose rather than through separate characters. The state table in
 * section 07 maps 1:1 onto `MascotState` below.
 *
 * The droplet doubles as the progress gauge: pass `fill` (0–1) and it holds
 * that much water, replacing the separate glass. The fill is done with plain
 * view clipping over two copies of the body — empty underneath, water on top —
 * rather than by animating SVG attributes, which keeps it on the same
 * well-trodden path as every other animation here.
 *
 * Section 07 recommends Rive for the production character. This SVG build is
 * the Phase 1 prototype called for in the development plan and keeps the same
 * state vocabulary, so swapping in a Rive state machine later is a
 * component-level change.
 */

import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';

import { color, duration, palette, spring } from '@/theme';

export type MascotState =
  | 'idle'
  | 'happy'
  | 'drink'
  | 'thinking'
  | 'thirsty'
  | 'celebrating'
  | 'sleepy'
  | 'sad';

/** The droplet silhouette, shared by every pose. */
const DROPLET_PATH =
  'M50 6 C50 6 82 42 82 62 C82 80 68 92 50 92 C32 92 18 80 18 62 C18 42 50 6 50 6 Z';

/** Where the silhouette starts and ends inside the 100-unit viewBox. */
const DROPLET_TOP = 6;
const DROPLET_BOTTOM = 92;
const FILL_SPAN = (DROPLET_BOTTOM - DROPLET_TOP) / 100; // 0.86 of the box
const FILL_BASE = (100 - DROPLET_BOTTOM) / 100; // 0.08 of the box

interface MascotProps {
  state?: MascotState;
  size?: number;
  reduceMotion?: boolean;
  /**
   * Water level in [0, 1]. Omit for a solid droplet (onboarding, where the
   * character is not standing in for progress).
   */
  fill?: number;
}

export function Mascot({ state = 'idle', size = 120, reduceMotion = false, fill }: MascotProps) {
  const float = useSharedValue(0);
  const pop = useSharedValue(0);
  const tilt = useSharedValue(0);

  // Idle float — 08 asks that idle loops stay subtle enough to ignore.
  useEffect(() => {
    if (reduceMotion) {
      float.value = 0;
      return;
    }
    const amplitude = state === 'sleepy' ? 3 : 6;
    const period = state === 'sleepy' ? duration.idleLoop * 1.4 : duration.idleLoop;
    float.value = withRepeat(
      withSequence(
        withTiming(-amplitude, { duration: period / 2, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: period / 2, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, [state, reduceMotion, float]);

  // Reaction poses. Under Reduce Motion these resolve instantly to the rest
  // position and the expression alone carries the state.
  useEffect(() => {
    if (reduceMotion) {
      pop.value = 0;
      tilt.value = state === 'thinking' ? -6 : state === 'sad' ? 4 : 0;
      return;
    }

    if (state === 'happy') {
      pop.value = withSequence(withSpring(-14, spring.press), withSpring(0, spring.card));
    } else if (state === 'celebrating') {
      pop.value = withSequence(
        withSpring(-26, spring.press),
        withSpring(0, spring.card),
        withSpring(-12, spring.press),
        withSpring(0, spring.card),
      );
    } else {
      pop.value = withSpring(0, spring.card);
    }

    tilt.value = withSpring(state === 'thinking' ? -6 : state === 'sad' ? 4 : 0, spring.card);
  }, [state, reduceMotion, pop, tilt]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: float.value + pop.value }, { rotateZ: `${tilt.value}deg` }],
  }));

  return (
    <Animated.View style={[{ width: size, height: size }, style]}>
      {fill === undefined ? (
        <SolidDroplet size={size} state={state} />
      ) : (
        <FillingDroplet size={size} state={state} fill={fill} reduceMotion={reduceMotion} />
      )}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <MascotFace state={state} size={size} />
      </View>
    </Animated.View>
  );
}

/** The character as a solid body — onboarding, where it is not a gauge. */
function SolidDroplet({ size, state }: { size: number; state: MascotState }) {
  return <MascotBody size={size} bodyColor={state === 'thirsty' ? palette.water300 : palette.water400} />;
}

/**
 * The character as the progress gauge. An empty body sits underneath; a
 * water-coloured copy is revealed from the bottom by a clipping view whose
 * height is the water level.
 */
function FillingDroplet({
  size,
  state,
  fill,
  reduceMotion,
}: {
  size: number;
  state: MascotState;
  fill: number;
  reduceMotion: boolean;
}) {
  const level = useSharedValue(0);
  const clamped = Math.max(0, Math.min(fill, 1));
  const maxHeight = size * FILL_SPAN;

  useEffect(() => {
    const target = clamped * maxHeight;
    level.value = reduceMotion
      ? withTiming(target, { duration: 0 })
      : withSpring(target, spring.water);
  }, [clamped, maxHeight, reduceMotion, level]);

  const waterStyle = useAnimatedStyle(() => ({ height: level.value }));

  return (
    <View style={{ width: size, height: size }}>
      {/* Empty body. */}
      <MascotBody size={size} bodyColor={palette.water100} outline={palette.water300} />

      {/* Water, revealed from the bottom of the silhouette upward. */}
      <Animated.View
        style={[
          styles.waterClip,
          { bottom: size * FILL_BASE, width: size },
          waterStyle,
        ]}
        pointerEvents="none"
      >
        <View style={{ position: 'absolute', bottom: -size * FILL_BASE, width: size, height: size }}>
          <MascotBody
            size={size}
            bodyColor={state === 'thirsty' ? palette.water300 : palette.water400}
          />
        </View>
      </Animated.View>

      {/* Outline on top so the silhouette stays crisp at every level. */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Path d={DROPLET_PATH} fill="none" stroke={palette.water400} strokeWidth={2.5} />
        </Svg>
      </View>
    </View>
  );
}

function MascotBody({
  size,
  bodyColor,
  outline,
}: {
  size: number;
  bodyColor: string;
  outline?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path
        d={DROPLET_PATH}
        fill={bodyColor}
        stroke={outline ?? 'none'}
        strokeWidth={outline ? 2.5 : 0}
      />
      {/* Inner highlight keeps the body reading as water, not as a balloon. */}
      <Path d="M35 40 C29 51 28 60 30 68 C22 62 24 49 35 40 Z" fill={palette.water200} opacity={0.9} />
    </Svg>
  );
}

/** The face, always drawn above the water so the character stays readable. */
function MascotFace({ state, size }: { state: MascotState; size: number }) {
  const face = FACES[state];

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {face.eyes === 'closed' ? (
        <>
          <Path d="M36 58 Q 40 62 44 58" stroke={color.textPrimary} strokeWidth={2.4} fill="none" strokeLinecap="round" />
          <Path d="M56 58 Q 60 62 64 58" stroke={color.textPrimary} strokeWidth={2.4} fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <Ellipse cx={40} cy={58} rx={face.eyes === 'wide' ? 5 : 4} ry={face.eyes === 'wide' ? 6 : 5} fill={color.textPrimary} />
          <Ellipse cx={60} cy={58} rx={face.eyes === 'wide' ? 5 : 4} ry={face.eyes === 'wide' ? 6 : 5} fill={color.textPrimary} />
          <Circle cx={41.5} cy={56} r={1.5} fill={color.surface} />
          <Circle cx={61.5} cy={56} r={1.5} fill={color.surface} />
        </>
      )}

      <Path d={face.mouth} stroke={color.textPrimary} strokeWidth={2.6} strokeLinecap="round" fill="none" />

      {face.blush ? (
        <>
          <Ellipse cx={31} cy={68} rx={5} ry={3} fill={palette.water200} opacity={0.95} />
          <Ellipse cx={69} cy={68} rx={5} ry={3} fill={palette.water200} opacity={0.95} />
        </>
      ) : null}

      {/* Celebration sparkles, and the droop that marks the gentle sad state. */}
      {state === 'celebrating' ? (
        <>
          <Circle cx={16} cy={34} r={3} fill={palette.water300} />
          <Circle cx={86} cy={40} r={2.4} fill={palette.water300} />
          <Circle cx={78} cy={22} r={2} fill={palette.water200} />
        </>
      ) : null}
      {state === 'sad' ? <Circle cx={66} cy={66} r={2.6} fill={palette.water200} /> : null}
    </Svg>
  );
}

interface FaceSpec {
  eyes: 'open' | 'wide' | 'closed';
  mouth: string;
  blush?: boolean;
}

/**
 * 07 — "never shame the user, imply danger, or create anxiety." The `sad` mouth
 * is a shallow curve, not a frown, and `thirsty` reads as low-energy rather
 * than distressed.
 */
const FACES: Record<MascotState, FaceSpec> = {
  idle: { eyes: 'open', mouth: 'M42 72 Q 50 78 58 72' },
  happy: { eyes: 'open', mouth: 'M40 70 Q 50 80 60 70', blush: true },
  drink: { eyes: 'closed', mouth: 'M45 72 Q 50 79 55 72' },
  thinking: { eyes: 'wide', mouth: 'M44 74 L 56 74' },
  thirsty: { eyes: 'open', mouth: 'M44 74 Q 50 71 56 74' },
  celebrating: { eyes: 'closed', mouth: 'M38 68 Q 50 82 62 68', blush: true },
  sleepy: { eyes: 'closed', mouth: 'M46 73 Q 50 77 54 73' },
  sad: { eyes: 'open', mouth: 'M44 75 Q 50 71 56 75' },
};

/** A quiet pedestal so the mascot never floats on nothing. */
export function MascotStage({
  state,
  size = 140,
  reduceMotion,
  fill,
}: {
  state?: MascotState;
  size?: number;
  reduceMotion?: boolean;
  fill?: number;
}) {
  return (
    <View style={styles.stage}>
      <Mascot state={state} size={size} reduceMotion={reduceMotion} fill={fill} />
      <View style={[styles.shadow, { width: size * 0.5 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    alignItems: 'center',
  },
  shadow: {
    height: 8,
    borderRadius: 4,
    marginTop: -4,
    backgroundColor: palette.water200,
    opacity: 0.6,
  },
  waterClip: {
    position: 'absolute',
    left: 0,
    overflow: 'hidden',
  },
});
