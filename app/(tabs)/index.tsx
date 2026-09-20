/**
 * Home — Product Bible 06.9, the primary daily interaction.
 *
 * Logging a glass runs the sequence from the animation table:
 *   water rises -> ripple -> bubbles -> mascot reaction -> progress count-up -> haptic.
 *
 * The glass is driven straight from the stored daily total, which is what makes
 * the MVP acceptance criterion "the visual glass always matches the stored
 * daily total" (20) hold by construction rather than by care.
 */

import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Celebration } from '@/components/Celebration';
import { useCountUp } from '@/components/CountUp';
import { Glass } from '@/components/Glass';
import { Icon } from '@/components/Icon';
import { Mascot, type MascotState } from '@/components/Mascot';
import {
  Body,
  BodyStrong,
  Caption,
  Card,
  Display,
  Micro,
  Spacer,
  Title,
} from '@/components/ui';
import { formatDayLabel, formatTime, greetingFor } from '@/domain/date';
import { formatMl, formatVolume, remainingMl } from '@/domain/hydration';
import { selectMascotState } from '@/domain/mascot';
import { useAppState } from '@/state/AppProvider';
import { color, elevation, radius, spacing, typography } from '@/theme';
import { haptic } from '@/utils/haptics';

/** How long the "happy" reaction and the undo affordance stay up after a log. */
const REACTION_MS = 2200;
const UNDO_WINDOW_MS = 12_000;

export default function HomeScreen() {
  const {
    activeGoal,
    consumedMl,
    goalMl,
    progress,
    goalReached,
    goalDay,
    today,
    entries,
    daily,
    settings,
    profile,
    reduceMotion,
    logWater,
    undoLastEntry,
    refresh,
  } = useAppState();

  const [justLogged, setJustLogged] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [undoVisible, setUndoVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pulseKey, setPulseKey] = useState(0);
  const [busy, setBusy] = useState(false);

  const reactionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const celebrationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (reactionTimer.current) clearTimeout(reactionTimer.current);
      if (celebrationTimer.current) clearTimeout(celebrationTimer.current);
      if (undoTimer.current) clearTimeout(undoTimer.current);
    },
    [],
  );

  const lastEntryAt = entries.length > 0 ? entries[entries.length - 1].loggedAt : null;

  const mascotState: MascotState = useMemo(
    () =>
      selectMascotState({
        goalReached,
        celebrating,
        justLogged,
        lastEntryAt,
      }),
    [goalReached, celebrating, justLogged, lastEntryAt],
  );

  const displayedMl = useCountUp({ value: consumedMl, immediate: reduceMotion });
  const displayedPercent = useCountUp({
    value: Math.round(progress * 100),
    immediate: reduceMotion,
  });

  const handleLog = useCallback(
    async (amountMl: number) => {
      if (busy) return;
      setBusy(true);
      try {
        const outcome = await logWater(amountMl, 'quick_add');

        setPulseKey((current) => current + 1);
        setJustLogged(true);
        setUndoVisible(true);

        // 08 — light on logging, stronger only on milestone completion.
        haptic(outcome.justCompleted ? 'success' : 'light');

        if (reactionTimer.current) clearTimeout(reactionTimer.current);
        reactionTimer.current = setTimeout(() => setJustLogged(false), REACTION_MS);

        if (undoTimer.current) clearTimeout(undoTimer.current);
        undoTimer.current = setTimeout(() => setUndoVisible(false), UNDO_WINDOW_MS);

        if (outcome.justCompleted) {
          setCelebrating(true);
          if (celebrationTimer.current) clearTimeout(celebrationTimer.current);
          celebrationTimer.current = setTimeout(() => setCelebrating(false), 2000);
        }
      } finally {
        setBusy(false);
      }
    },
    [busy, logWater],
  );

  const handleUndo = useCallback(async () => {
    haptic('light');
    setUndoVisible(false);
    setJustLogged(false);
    await undoLastEntry();
  }, [undoLastEntry]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const left = remainingMl(consumedMl, goalMl);
  const quickAdd = settings.quickAddMl;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={color.accent} />}
      >
        {/* Header — greeting, date, goal day (06.9). */}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Title>
              {greetingFor()}
              {profile?.displayName ? `, ${profile.displayName}` : ''}
            </Title>
            <Caption tone="muted">{formatDayLabel(today)}</Caption>
          </View>
          {activeGoal ? (
            <View style={styles.dayChip}>
              <Micro tone="accent">
                DAY {goalDay} / {activeGoal.durationDays}
              </Micro>
            </View>
          ) : null}
        </View>

        <Spacer size={spacing.xl} />

        {/* Hero: the glass, with the mascot beside it rather than over it. */}
        <View style={styles.hero}>
          <Glass
            progress={progress}
            width={186}
            height={278}
            reduceMotion={reduceMotion}
            pulseKey={pulseKey}
          />
          <View style={styles.mascotSlot} pointerEvents="none">
            <Mascot state={mascotState} size={96} reduceMotion={reduceMotion} />
          </View>
        </View>

        <Spacer size={spacing.xl} />

        {/* Current amount / daily goal / percentage. */}
        <View style={styles.readout}>
          <Display style={styles.amount}>{formatMl(displayedMl)}</Display>
          <Body tone="secondary">
            of {formatVolume(goalMl)} · {displayedPercent}%
          </Body>
        </View>

        <Spacer size={spacing.lg} />

        {goalReached ? (
          <Card style={styles.completeCard}>
            <BodyStrong tone="accent">Goal complete for today.</BodyStrong>
            <Caption tone="secondary" style={styles.completeCopy}>
              Reminders are off for the rest of the day. Keep logging if you like — it will not
              change today&apos;s target.
            </Caption>
          </Card>
        ) : (
          <Card style={styles.remainingCard}>
            <Caption tone="muted">Still to go</Caption>
            <Spacer size={spacing.xs} />
            <BodyStrong>{formatVolume(left)}</BodyStrong>
          </Card>
        )}

        <Spacer size={spacing.xl} />

        {/* Quick add (06.9) + custom amount (06.10). */}
        <Caption tone="muted">Log a drink</Caption>
        <Spacer size={spacing.sm} />
        <View style={styles.quickRow}>
          {quickAdd.map((amount) => (
            <QuickAddButton
              key={amount}
              amount={amount}
              disabled={busy}
              onPress={() => void handleLog(amount)}
            />
          ))}
        </View>

        <Spacer size={spacing.md} />

        <View style={styles.secondaryRow}>
          <Pressable
            accessibilityRole="button"
            style={styles.secondaryAction}
            onPress={() => router.push('/custom-amount')}
          >
            <Icon name="plus" size={18} color={color.accentStrong} />
            <BodyStrong tone="accent" style={styles.secondaryLabel}>
              Custom amount
            </BodyStrong>
          </Pressable>

          {undoVisible && entries.length > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Undo last entry"
              style={styles.secondaryAction}
              onPress={() => void handleUndo()}
            >
              <Icon name="undo" size={18} color={color.textSecondary} />
              <BodyStrong tone="secondary" style={styles.secondaryLabel}>
                Undo
              </BodyStrong>
            </Pressable>
          ) : null}
        </View>

        <Spacer size={spacing.xl} />

        {/* Today's log — the Home-side preview of the 06.13 timeline. */}
        {entries.length > 0 ? (
          <Card>
            <Caption tone="muted">Today</Caption>
            <Spacer size={spacing.sm} />
            {entries
              .slice()
              .reverse()
              .slice(0, 5)
              .map((entry) => (
                <View key={entry.id} style={styles.entryRow}>
                  <Body>{formatMl(entry.amountMl)}</Body>
                  <Caption tone="muted">{formatTime(entry.loggedAt)}</Caption>
                </View>
              ))}
            {daily && daily.entryCount > 5 ? (
              <Caption tone="muted" style={styles.entryMore}>
                +{daily.entryCount - 5} earlier today
              </Caption>
            ) : null}
          </Card>
        ) : (
          <Card>
            <Body tone="secondary">
              Nothing logged yet today. Tap an amount above when you take a sip.
            </Body>
          </Card>
        )}

        <Spacer size={spacing.xxl} />
      </ScrollView>

      <Celebration active={celebrating} reduceMotion={reduceMotion} />
    </SafeAreaView>
  );
}

function QuickAddButton({
  amount,
  disabled,
  onPress,
}: {
  amount: number;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Log ${amount} millilitres`}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.quickButton,
        pressed && styles.quickButtonPressed,
        disabled && styles.quickButtonDisabled,
      ]}
    >
      <Icon name="drop" size={22} color={color.accentStrong} />
      <BodyStrong tone="accent" style={styles.quickLabel}>
        {amount}
      </BodyStrong>
      <Micro tone="muted">ml</Micro>
    </Pressable>
  );
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
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  headerText: {
    flex: 1,
    gap: spacing.xs,
  },
  dayChip: {
    backgroundColor: color.accentWash,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  hero: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Beside the glass, never across it (06.9).
  mascotSlot: {
    position: 'absolute',
    right: -6,
    bottom: -10,
  },
  readout: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  amount: {
    color: color.accentStrong,
  },
  completeCard: {
    backgroundColor: color.accentWash,
    borderColor: color.accentSoft,
  },
  completeCopy: {
    marginTop: spacing.xs,
  },
  remainingCard: {
    alignItems: 'flex-start',
  },
  quickRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  quickButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    ...elevation.card,
  },
  quickButtonPressed: {
    transform: [{ scale: 0.97 }],
    backgroundColor: color.accentWash,
  },
  quickButtonDisabled: {
    opacity: 0.5,
  },
  quickLabel: {
    ...typography.heading,
    color: color.accentStrong,
  },
  secondaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.lg,
  },
  secondaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  secondaryLabel: {
    marginTop: 1,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  entryMore: {
    marginTop: spacing.sm,
  },
});
