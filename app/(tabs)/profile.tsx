/**
 * Profile / Settings — Product Bible 06.15.
 *
 * "Keep mascot absent or extremely subtle; settings should feel calm and
 * utility-focused." There is no mascot on this screen by design.
 */

import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Body, BodyStrong, Caption, Card, Spacer, Title } from '@/components/ui';
import { formatDayLabel } from '@/domain/date';
import { describeDuration, goalDayNumber } from '@/domain/goals';
import { DEFAULT_QUICK_ADD_ML, formatVolume } from '@/domain/hydration';
import { useAppState } from '@/state/AppProvider';
import { color, radius, spacing } from '@/theme';

const QUICK_ADD_SETS: number[][] = [
  [150, 250, 500],
  [200, 300, 600],
  [250, 500, 750],
];

export default function ProfileScreen() {
  const {
    profile,
    settings,
    activeGoal,
    today,
    updateSettings,
    resetLocalData,
    signOut,
  } = useAppState();
  const [busy, setBusy] = useState(false);

  const confirmReset = () => {
    Alert.alert(
      'Reset local data?',
      'This clears your goals, history and every logged entry on this device. It cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            setBusy(true);
            await resetLocalData();
            setBusy(false);
            router.replace('/');
          },
        },
      ],
    );
  };

  const confirmSignOut = () => {
    Alert.alert('Sign out?', 'Your hydration history stays on this device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        onPress: async () => {
          await signOut();
          router.replace('/');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Title>Profile</Title>
        <Spacer size={spacing.lg} />

        {/* Account */}
        <Card>
          <Caption tone="muted">Account</Caption>
          <Spacer size={spacing.sm} />
          <BodyStrong>{profile?.displayName ?? 'Signed in'}</BodyStrong>
          <Caption tone="secondary">
            {profile?.email ?? `Local profile · ${profile?.provider ?? 'none'}`}
          </Caption>
        </Card>

        <Spacer size={spacing.lg} />

        {/* Current goal summary */}
        <Card>
          <Caption tone="muted">Current goal</Caption>
          <Spacer size={spacing.sm} />
          {activeGoal ? (
            <>
              <BodyStrong>{formatVolume(activeGoal.dailyGoalMl)} a day</BodyStrong>
              <Caption tone="secondary">
                Day {goalDayNumber(activeGoal, today)} of {activeGoal.durationDays} ·{' '}
                {describeDuration(activeGoal.durationDays)}
              </Caption>
              <Caption tone="muted">Ends {formatDayLabel(activeGoal.endDate)}</Caption>
            </>
          ) : (
            <Body tone="secondary">No active goal.</Body>
          )}
          <Spacer size={spacing.md} />
          <Pressable accessibilityRole="button" onPress={() => router.push('/(onboarding)/goal')}>
            <BodyStrong tone="accent">
              {activeGoal ? 'Start a new goal' : 'Set a goal'}
            </BodyStrong>
          </Pressable>
          {activeGoal ? (
            <Caption tone="muted" style={styles.note}>
              A new goal starts a new period. Days already logged keep their original target.
            </Caption>
          ) : null}
        </Card>

        <Spacer size={spacing.lg} />

        {/* Notification settings */}
        <Card>
          <Caption tone="muted">Reminders</Caption>
          <Spacer size={spacing.sm} />
          <ToggleRow
            label="Hydration reminders"
            hint="Randomized around a 3-hour rhythm, with quiet hours respected."
            value={settings.notificationsEnabled}
            onChange={(next) => void updateSettings({ notificationsEnabled: next })}
          />
          <Divider />
          <ToggleRow
            label="Remind me after my goal"
            hint="Off by default — AQUIS goes quiet once you hit 100%."
            value={settings.postGoalRemindersEnabled}
            onChange={(next) => void updateSettings({ postGoalRemindersEnabled: next })}
          />
          <Divider />
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Body>Quiet hours</Body>
              <Caption tone="muted">
                {settings.quietStart} – {settings.quietEnd}
              </Caption>
            </View>
          </View>
        </Card>

        <Spacer size={spacing.lg} />

        {/* Default quick-add values (06.15) */}
        <Card>
          <Caption tone="muted">Quick-add amounts</Caption>
          <Spacer size={spacing.sm} />
          <View style={styles.chips}>
            {QUICK_ADD_SETS.map((set) => {
              const selected = set.join(',') === settings.quickAddMl.join(',');
              return (
                <Pressable
                  key={set.join('-')}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => void updateSettings({ quickAddMl: set })}
                  style={[styles.chip, selected && styles.chipSelected]}
                >
                  <Caption tone={selected ? 'accent' : 'secondary'}>{set.join(' · ')} ml</Caption>
                </Pressable>
              );
            })}
          </View>
          {settings.quickAddMl.join(',') !== DEFAULT_QUICK_ADD_ML.join(',') ? (
            <>
              <Spacer size={spacing.sm} />
              <Pressable
                accessibilityRole="button"
                onPress={() => void updateSettings({ quickAddMl: [...DEFAULT_QUICK_ADD_ML] })}
              >
                <Caption tone="accent">Reset to default</Caption>
              </Pressable>
            </>
          ) : null}
        </Card>

        <Spacer size={spacing.lg} />

        {/* Accessibility */}
        <Card>
          <Caption tone="muted">Motion &amp; feedback</Caption>
          <Spacer size={spacing.sm} />
          <ToggleRow
            label="Reduce motion"
            hint="Replaces looping and large movement with simple fades."
            value={settings.reduceMotion}
            onChange={(next) => void updateSettings({ reduceMotion: next })}
          />
          <Divider />
          <ToggleRow
            label="Haptics"
            hint="A light tap when you log, a stronger one when you finish the day."
            value={settings.hapticsEnabled}
            onChange={(next) => void updateSettings({ hapticsEnabled: next })}
          />
        </Card>

        <Spacer size={spacing.lg} />

        {/* About / privacy (17) */}
        <Card>
          <Caption tone="muted">About</Caption>
          <Spacer size={spacing.sm} />
          <Body tone="secondary">
            AQUIS keeps everything on this device. No account sync, no analytics upload, no ads.
          </Body>
          <Spacer size={spacing.sm} />
          <Caption tone="muted">
            AQUIS offers general wellness guidance. It is not a medical device and does not diagnose
            dehydration.
          </Caption>
        </Card>

        <Spacer size={spacing.lg} />

        <Pressable accessibilityRole="button" disabled={busy} onPress={confirmSignOut}>
          <Card style={styles.actionCard}>
            <BodyStrong tone="accent">Sign out</BodyStrong>
          </Card>
        </Pressable>

        <Spacer size={spacing.md} />

        <Pressable accessibilityRole="button" disabled={busy} onPress={confirmReset}>
          <Card style={styles.actionCard}>
            <BodyStrong style={styles.destructive}>Reset local data</BodyStrong>
          </Card>
        </Pressable>

        <Spacer size={spacing.xxl} />
      </ScrollView>
    </SafeAreaView>
  );
}

function ToggleRow({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Body>{label}</Body>
        <Caption tone="muted">{hint}</Caption>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: color.accent, false: color.border }}
        thumbColor={color.surface}
        accessibilityLabel={label}
      />
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.background,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  divider: {
    height: 1,
    backgroundColor: color.border,
    marginVertical: spacing.md,
  },
  note: {
    marginTop: spacing.xs,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.surface,
  },
  chipSelected: {
    borderColor: color.accent,
    backgroundColor: color.accentWash,
  },
  actionCard: {
    alignItems: 'center',
  },
  destructive: {
    color: color.warning,
  },
});
