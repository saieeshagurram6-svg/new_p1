/**
 * Goal confirmation — Product Bible 06.8.
 *
 * "Show daily target, duration and Day 1." The mascot fills to the selected
 * daily target and celebrates. CTA: Start my goal.
 *
 * This is where the draft becomes a domain record: the goal period, the
 * notification preference and the onboarding flag are all written here, so a
 * half-finished onboarding leaves nothing behind.
 */

import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Mascot } from '@/components/Mascot';
import { Body, Button, Caption, Card, Notice, Screen, Spacer, Title } from '@/components/ui';
import { addDays, formatDayLabel, todayLocal } from '@/domain/date';
import { formatVolume } from '@/domain/hydration';
import { useAppState } from '@/state/AppProvider';
import { useOnboarding } from '@/state/OnboardingProvider';
import { color, spacing } from '@/theme';
import { haptic } from '@/utils/haptics';

export default function GoalConfirmScreen() {
  const { startGoal, updateSettings, reduceMotion } = useAppState();
  const { dailyGoalMl, durationDays, notificationsEnabled, reset } = useOnboarding();
  const [fill, setFill] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = todayLocal();
  const end = addDays(start, durationDays - 1);

  // The droplet fills to the selected target as the screen settles.
  useEffect(() => {
    if (reduceMotion) {
      setFill(1);
      return;
    }
    const timer = setTimeout(() => setFill(1), 260);
    return () => clearTimeout(timer);
  }, [reduceMotion]);

  const handleStart = async () => {
    setBusy(true);
    setError(null);
    try {
      await startGoal({ dailyGoalMl, durationDays });
      await updateSettings({ notificationsEnabled, onboardingCompleted: true });
      haptic('success');
      reset();
      router.replace('/(tabs)');
    } catch (cause) {
      setBusy(false);
      setError(cause instanceof Error ? cause.message : 'Could not save your goal. Try again?');
    }
  };

  return (
    <Screen scroll contentStyle={styles.content}>
      <View style={styles.hero}>
        <Mascot state="celebrating" size={196} reduceMotion={reduceMotion} fill={fill} />
      </View>

      <Spacer size={spacing.xl} />

      <Title center>You are all set.</Title>
      <Spacer size={spacing.sm} />
      <Body tone="secondary" center>
        Here is the goal AQUIS will keep you company on.
      </Body>

      <Spacer size={spacing.xl} />

      <Card>
        <Row label="Daily target" value={formatVolume(dailyGoalMl)} />
        <Divider />
        <Row label="Goal length" value={`${durationDays} days`} />
        <Divider />
        <Row label="Starting" value={`Day 1 — ${formatDayLabel(start)}`} />
        <Divider />
        <Row label="Ending" value={formatDayLabel(end)} />
        <Divider />
        <Row label="Reminders" value={notificationsEnabled ? 'On' : 'Off'} />
      </Card>

      {error ? (
        <>
          <Spacer size={spacing.md} />
          <Notice text={error} tone="accent" />
        </>
      ) : null}

      <Spacer size={spacing.xl} />
      <Button label={busy ? 'Starting…' : 'Start my goal'} disabled={busy} onPress={handleStart} />
      <Spacer size={spacing.md} />
      <Caption tone="muted" center>
        Changing your goal later starts a new period. Days you have already logged keep their
        original target.
      </Caption>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Body tone="secondary">{label}</Body>
      <Body style={styles.rowValue}>{value}</Body>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  hero: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  rowValue: {
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: color.border,
    marginVertical: spacing.md,
  },
});
