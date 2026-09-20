/**
 * Shared UI primitives.
 *
 * Motion here follows the Product Bible 08 table: buttons spring 0.97 -> 1.0,
 * cards lift on selection, and everything lands inside the 150–500 ms budget.
 */

import React, { useCallback } from 'react';
import {
  Pressable,
  type PressableProps,
  ScrollView,
  StyleSheet,
  Text,
  type TextProps,
  View,
  type ViewProps,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { color, duration, elevation, radius, spacing, spring, typography } from '@/theme';
import { haptic } from '@/utils/haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/* ------------------------------------------------------------------ layout */

export function Screen({
  children,
  scroll = false,
  edges = ['top', 'bottom'],
  contentStyle,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  edges?: readonly Edge[];
  contentStyle?: ViewProps['style'];
}) {
  return (
    <SafeAreaView style={styles.screen} edges={edges}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.screenContent, contentStyle]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.screenContent, styles.screenFlex, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

export function Spacer({ size = spacing.lg }: { size?: number }) {
  return <View style={{ height: size }} />;
}

export function Card({ children, style, ...rest }: ViewProps) {
  return (
    <View style={[styles.card, style]} {...rest}>
      {children}
    </View>
  );
}

/* -------------------------------------------------------------------- text */

type TextTone = 'primary' | 'secondary' | 'muted' | 'accent' | 'onAccent';

const TONE: Record<TextTone, string> = {
  primary: color.textPrimary,
  secondary: color.textSecondary,
  muted: color.textMuted,
  accent: color.accentStrong,
  onAccent: color.textOnAccent,
};

interface TypeProps extends TextProps {
  tone?: TextTone;
  center?: boolean;
}

function makeText(variant: keyof typeof typography) {
  return function Typed({ style, tone = 'primary', center, ...rest }: TypeProps) {
    return (
      <Text
        style={[
          typography[variant] as TextProps['style'],
          { color: TONE[tone] },
          center && styles.center,
          style,
        ]}
        {...rest}
      />
    );
  };
}

export const Display = makeText('display');
export const Title = makeText('title');
export const Heading = makeText('heading');
export const Body = makeText('body');
export const BodyStrong = makeText('bodyStrong');
export const Caption = makeText('caption');
export const Micro = makeText('micro');

/* ----------------------------------------------------------------- buttons */

interface ButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  fullWidth?: boolean;
  /** Fires light haptic feedback on press (08). */
  hapticOnPress?: boolean;
}

export function Button({
  label,
  variant = 'primary',
  fullWidth = true,
  hapticOnPress = true,
  disabled,
  onPress,
  ...rest
}: ButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.97, spring.press);
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, spring.press);
  }, [scale]);

  const handlePress = useCallback<NonNullable<PressableProps['onPress']>>(
    (event) => {
      if (hapticOnPress) haptic('light');
      onPress?.(event);
    },
    [hapticOnPress, onPress],
  );

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      style={[
        styles.button,
        variant === 'primary' && styles.buttonPrimary,
        variant === 'secondary' && styles.buttonSecondary,
        variant === 'ghost' && styles.buttonGhost,
        fullWidth && styles.buttonFull,
        disabled && styles.buttonDisabled,
        animatedStyle,
      ]}
      {...rest}
    >
      <Text
        style={[
          styles.buttonLabel,
          variant === 'primary' ? styles.buttonLabelPrimary : styles.buttonLabelSecondary,
        ]}
      >
        {label}
      </Text>
    </AnimatedPressable>
  );
}

/**
 * Selection card used by goal setup and duration (06.4, 06.5).
 * "Selected card rises with spring animation."
 */
export function OptionCard({
  title,
  subtitle,
  selected,
  onPress,
  compact = false,
}: {
  title: string;
  subtitle?: string;
  selected: boolean;
  onPress: () => void;
  compact?: boolean;
}) {
  const lift = useSharedValue(0);

  React.useEffect(() => {
    lift.value = withSpring(selected ? -6 : 0, spring.card);
  }, [selected, lift]);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ translateY: lift.value }] }));

  return (
    <AnimatedPressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={() => {
        haptic('light');
        onPress();
      }}
      style={[
        styles.option,
        compact && styles.optionCompact,
        selected && styles.optionSelected,
        animatedStyle,
      ]}
    >
      <Text style={[styles.optionTitle, selected && styles.optionTitleSelected]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.optionSubtitle, selected && styles.optionSubtitleSelected]}>
          {subtitle}
        </Text>
      ) : null}
    </AnimatedPressable>
  );
}

/** A quiet inline notice — used for validation and empty states. */
export function Notice({ text, tone = 'muted' }: { text: string; tone?: TextTone }) {
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    opacity.value = withTiming(1, { duration: duration.quick });
  }, [text, opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={style}>
      <Caption tone={tone} center>
        {text}
      </Caption>
    </Animated.View>
  );
}

/* ------------------------------------------------------------------ styles */

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.background,
  },
  screenContent: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  screenFlex: {
    flex: 1,
  },
  center: {
    textAlign: 'center',
  },
  card: {
    backgroundColor: color.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: color.border,
    ...elevation.card,
  },
  button: {
    minHeight: 54,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  buttonFull: {
    alignSelf: 'stretch',
  },
  buttonPrimary: {
    backgroundColor: color.accent,
    ...elevation.card,
  },
  buttonSecondary: {
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
  },
  buttonGhost: {
    backgroundColor: 'transparent',
    minHeight: 44,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonLabelPrimary: {
    color: color.textOnAccent,
  },
  buttonLabelSecondary: {
    color: color.accentStrong,
  },
  option: {
    flexGrow: 1,
    flexBasis: '46%',
    minHeight: 88,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: color.border,
    backgroundColor: color.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  optionCompact: {
    minHeight: 68,
  },
  optionSelected: {
    borderColor: color.accent,
    backgroundColor: color.accentWash,
    ...elevation.card,
  },
  optionTitle: {
    ...typography.heading,
    color: color.textPrimary,
  },
  optionTitleSelected: {
    color: color.accentStrong,
  },
  optionSubtitle: {
    ...typography.caption,
    color: color.textMuted,
    marginTop: spacing.xs,
  },
  optionSubtitleSelected: {
    color: color.accentStrong,
  },
});
