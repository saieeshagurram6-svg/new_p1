/**
 * Goal setup — Product Bible 06.4.
 *
 * "Large animated glass reflects selected target. Dragging/tapping a target
 * animates water level to the corresponding scale."
 *
 * The glass here is a *scale* preview, not progress: the level shows the chosen
 * target against the largest preset, so 3 L fills it.
 */

import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, TextInput, View } from 'react-native';

import { Glass } from '@/components/Glass';
import { Body, Button, Caption, Notice, OptionCard, Screen, Spacer, Title } from '@/components/ui';
import {
  GOAL_PRESETS_ML,
  formatVolume,
  MAX_GOAL_ML,
  validateGoalAmount,
} from '@/domain/hydration';
import { useAppState } from '@/state/AppProvider';
import { useOnboarding } from '@/state/OnboardingProvider';
import { color, radius, spacing, typography } from '@/theme';

/** The preset that fills the preview glass. */
const VISUAL_FULL_ML = GOAL_PRESETS_ML[GOAL_PRESETS_ML.length - 1];

export default function GoalSetupScreen() {
  const { reduceMotion } = useAppState();
  const { dailyGoalMl, setDailyGoalMl } = useOnboarding();
  const [customMode, setCustomMode] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isPreset = useMemo(
    () => (GOAL_PRESETS_ML as readonly number[]).includes(dailyGoalMl),
    [dailyGoalMl],
  );

  const applyCustom = () => {
    const result = validateGoalAmount(customValue);
    if (!result.ok) {
      setError(result.message ?? null);
      return;
    }
    setError(null);
    setDailyGoalMl(result.value as number);
    setCustomMode(false);
  };

  return (
    <Screen scroll contentStyle={styles.content}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Title center>How much water a day?</Title>
        <Spacer size={spacing.sm} />
        <Body tone="secondary" center>
          Pick a daily target. You can change it whenever you like.
        </Body>

        <View style={styles.preview}>
          <Glass
            progress={Math.min(dailyGoalMl / VISUAL_FULL_ML, 1)}
            width={150}
            height={220}
            reduceMotion={reduceMotion}
          >
            <View style={styles.previewLabel}>
              <Title style={styles.previewValue}>{formatVolume(dailyGoalMl)}</Title>
            </View>
          </Glass>
        </View>

        <View style={styles.grid}>
          {GOAL_PRESETS_ML.map((preset) => (
            <OptionCard
              key={preset}
              title={formatVolume(preset)}
              subtitle={`${preset} ml`}
              selected={dailyGoalMl === preset}
              onPress={() => {
                setError(null);
                setCustomMode(false);
                setDailyGoalMl(preset);
              }}
            />
          ))}
        </View>

        <Spacer size={spacing.lg} />

        {customMode ? (
          <View style={styles.custom}>
            <TextInput
              value={customValue}
              onChangeText={(next) => {
                setCustomValue(next);
                setError(null);
              }}
              placeholder={`Millilitres (up to ${MAX_GOAL_ML})`}
              placeholderTextColor={color.textMuted}
              keyboardType="number-pad"
              inputMode="numeric"
              returnKeyType="done"
              onSubmitEditing={applyCustom}
              style={styles.input}
              accessibilityLabel="Custom daily target in millilitres"
            />
            <Button label="Use this target" variant="secondary" onPress={applyCustom} />
          </View>
        ) : (
          <Button
            label={isPreset ? 'Set a custom amount' : `Custom: ${formatVolume(dailyGoalMl)}`}
            variant="ghost"
            onPress={() => {
              setCustomValue(isPreset ? '' : String(dailyGoalMl));
              setCustomMode(true);
            }}
          />
        )}

        {error ? (
          <>
            <Spacer size={spacing.sm} />
            <Notice text={error} tone="accent" />
          </>
        ) : null}

        <Spacer size={spacing.xl} />
        <Button label="Continue" onPress={() => router.push('/(onboarding)/duration')} />
        <Spacer size={spacing.md} />
        <Caption tone="muted" center>
          General wellness guidance, not medical advice.
        </Caption>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  preview: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  previewLabel: {
    backgroundColor: color.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  previewValue: {
    color: color.accentStrong,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  custom: {
    gap: spacing.sm,
  },
  input: {
    ...typography.body,
    color: color.textPrimary,
    backgroundColor: color.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    minHeight: 54,
    textAlign: 'center',
  },
});
