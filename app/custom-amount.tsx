/**
 * Custom water entry — Product Bible 06.10.
 *
 * "Numeric amount entry. Optional quick chips. Confirm / Cancel. Validate
 * positive amount and reasonable maximum per entry. Store exact amount and
 * timestamp."
 */

import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Mascot } from '@/components/Mascot';
import {
  Body,
  BodyStrong,
  Button,
  Caption,
  Notice,
  Screen,
  Spacer,
  Title,
} from '@/components/ui';
import { MAX_ENTRY_ML, formatVolume, validateEntryAmount } from '@/domain/hydration';
import { useAppState } from '@/state/AppProvider';
import { color, radius, spacing, typography } from '@/theme';
import { haptic } from '@/utils/haptics';

const CHIPS = [100, 200, 330, 400, 600, 750];

export default function CustomAmountScreen() {
  const { logWater, consumedMl, goalMl, reduceMotion } = useAppState();
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const parsed = useMemo(() => validateEntryAmount(value), [value]);
  const amount = parsed.ok ? (parsed.value as number) : 0;

  // Preview: where this entry would leave today's droplet.
  const previewProgress = goalMl > 0 ? Math.min((consumedMl + amount) / goalMl, 1) : 0;

  const confirm = async () => {
    const result = validateEntryAmount(value);
    if (!result.ok) {
      setError(result.message ?? null);
      return;
    }
    setBusy(true);
    try {
      const outcome = await logWater(result.value as number, 'custom');
      haptic(outcome.justCompleted ? 'success' : 'light');
      router.back();
    } catch (cause) {
      setBusy(false);
      setError(cause instanceof Error ? cause.message : 'Could not save that entry.');
    }
  };

  return (
    <Screen scroll contentStyle={styles.content}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Title center>Custom amount</Title>
        <Spacer size={spacing.sm} />
        <Body tone="secondary" center>
          How much did you drink?
        </Body>

        <Spacer size={spacing.xl} />

        <View style={styles.previewRow}>
          <Mascot state="idle" size={108} reduceMotion={reduceMotion} fill={previewProgress} />
          <View style={styles.previewText}>
            <Caption tone="muted">Today would reach</Caption>
            <Spacer size={spacing.xs} />
            <BodyStrong>{formatVolume(consumedMl + amount)}</BodyStrong>
            <Caption tone="muted">of {formatVolume(goalMl)}</Caption>
          </View>
        </View>

        <Spacer size={spacing.xl} />

        <TextInput
          value={value}
          onChangeText={(next) => {
            setValue(next);
            setError(null);
          }}
          placeholder="0"
          placeholderTextColor={color.textMuted}
          keyboardType="number-pad"
          inputMode="numeric"
          returnKeyType="done"
          onSubmitEditing={() => void confirm()}
          autoFocus
          style={styles.input}
          accessibilityLabel="Amount in millilitres"
        />
        <Caption tone="muted" center>
          millilitres (up to {MAX_ENTRY_ML})
        </Caption>

        <Spacer size={spacing.lg} />

        <View style={styles.chips}>
          {CHIPS.map((chip) => (
            <Pressable
              key={chip}
              accessibilityRole="button"
              onPress={() => {
                haptic('light');
                setValue(String(chip));
                setError(null);
              }}
              style={({ pressed }) => [
                styles.chip,
                value === String(chip) && styles.chipSelected,
                pressed && styles.chipPressed,
              ]}
            >
              <Caption tone={value === String(chip) ? 'accent' : 'secondary'}>{chip} ml</Caption>
            </Pressable>
          ))}
        </View>

        {error ? (
          <>
            <Spacer size={spacing.md} />
            <Notice text={error} tone="accent" />
          </>
        ) : null}

        <Spacer size={spacing.xl} />

        <Button
          label={busy ? 'Saving…' : 'Add to today'}
          disabled={busy || !parsed.ok}
          onPress={() => void confirm()}
        />
        <Spacer size={spacing.sm} />
        <Button label="Cancel" variant="ghost" onPress={() => router.back()} />
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
  },
  previewText: {
    alignItems: 'flex-start',
  },
  input: {
    ...typography.display,
    color: color.textPrimary,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.surface,
  },
  chipSelected: {
    borderColor: color.accent,
    backgroundColor: color.accentWash,
  },
  chipPressed: {
    opacity: 0.7,
  },
});
