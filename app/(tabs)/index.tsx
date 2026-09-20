/**
 * Home — Product Bible 06.9, the primary daily interaction.
 *
 * The droplet *is* the gauge: logging water raises the level inside the
 * character, which then reacts, while the amount counts up and a haptic fires
 * (the section 08 sequence, with the mascot standing in for the glass).
 *
 * The level is driven straight from the stored daily total, which is what makes
 * the MVP acceptance criterion "the visual glass always matches the stored
 * daily total" (20) hold by construction rather than by care.
 */

import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Celebration } from '@/components/Celebration';
import { useCountUp } from '@/components/CountUp';
import { Icon } from '@/components/Icon';
import { Mascot, type MascotState } from '@/components/Mascot';
import { Body, BodyStrong, Caption, Card, Display, Micro, Spacer, Title } from '@/components/ui';
import { formatDayLabel, formatTime, greetingFor } from '@/domain/date';
import { formatMl, formatVolume, remainingMl } from '@/domain/hydration';
import { selectMascotState } from '@/domain/mascot';
import type { WaterEntry } from '@/domain/types';
import { useAppState } from '@/state/AppProvider';
import { color, elevation, palette, radius, spacing, typography } from '@/theme';
import { haptic } from '@/utils/haptics';

/** How long the "happy" reaction stays up after a log. */
const REACTION_MS = 2200;
const MASCOT_SIZE = 236;

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
    settings,
    profile,
    reduceMotion,
    logWater,
    removeEntry,
    refresh,
  } = useAppState();

  const [justLogged, setJustLogged] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);

  const reactionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const celebrationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (reactionTimer.current) clearTimeout(reactionTimer.current);
      if (celebrationTimer.current) clearTimeout(celebrationTimer.current);
    },
    [],
  );

  const lastEntryAt = entries.length > 0 ? entries[entries.length - 1].loggedAt : null;

  const mascotState: MascotState = useMemo(
    () => selectMascotState({ goalReached, celebrating, justLogged, lastEntryAt }),
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

        setJustLogged(true);
        // 08 — light on logging, stronger only on milestone completion.
        haptic(outcome.justCompleted ? 'success' : 'light');

        if (reactionTimer.current) clearTimeout(reactionTimer.current);
        reactionTimer.current = setTimeout(() => setJustLogged(false), REACTION_MS);

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

  const handleUndoEntry = useCallback(
    async (entry: WaterEntry) => {
      haptic('light');
      setJustLogged(false);
      await removeEntry(entry.id);
    },
    [removeEntry],
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const left = remainingMl(consumedMl, goalMl);
  // Newest first: the entry you most likely want to undo sits at the top.
  const timeline = useMemo(() => entries.slice().reverse(), [entries]);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={color.accent} />
        }
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

        <Spacer size={spacing.lg} />

        {/* Hero: the droplet holds the day's water. */}
        <View style={styles.hero}>
          <View style={styles.heroGlow} pointerEvents="none" />
          <Mascot
            state={mascotState}
            size={MASCOT_SIZE}
            reduceMotion={reduceMotion}
            fill={progress}
          />
        </View>

        <Spacer size={spacing.lg} />

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
          {settings.quickAddMl.map((amount) => (
            <QuickAddButton
              key={amount}
              amount={amount}
              disabled={busy}
              onPress={() => void handleLog(amount)}
            />
          ))}
        </View>

        <Spacer size={spacing.md} />

        <Pressable
          accessibilityRole="button"
          style={styles.customAction}
          onPress={() => router.push('/custom-amount')}
        >
          <Icon name="plus" size={18} color={color.accentStrong} />
          <BodyStrong tone="accent" style={styles.customLabel}>
            Custom amount
          </BodyStrong>
        </Pressable>

        <Spacer size={spacing.xl} />

        {/* Today's log. Every entry can be undone, not just the most recent. */}
        <Caption tone="muted">Today</Caption>
        <Spacer size={spacing.sm} />
        {timeline.length > 0 ? (
          <Card>
            {timeline.map((entry, index) => (
              <View key={entry.id}>
                {index > 0 ? <View style={styles.divider} /> : null}
                <EntryRow entry={entry} onUndo={() => void handleUndoEntry(entry)} />
              </View>
            ))}
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

/** One logged drink, with its own undo — 09, "edits/deletes should be explicit". */
function EntryRow({ entry, onUndo }: { entry: WaterEntry; onUndo: () => void }) {
  return (
    <View style={styles.entryRow}>
      <View style={styles.entryDrop}>
        <Icon name="drop" size={16} color={color.accentStrong} />
      </View>
      <View style={styles.entryText}>
        <BodyStrong>{formatMl(entry.amountMl)}</BodyStrong>
        <Caption tone="muted">{formatTime(entry.loggedAt)}</Caption>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Undo ${entry.amountMl} millilitres logged at ${formatTime(entry.loggedAt)}`}
        hitSlop={8}
        onPress={onUndo}
        style={({ pressed }) => [styles.undoButton, pressed && styles.undoButtonPressed]}
      >
        <Icon name="undo" size={15} color={color.textSecondary} />
        <Caption tone="secondary">Undo</Caption>
      </Pressable>
    </View>
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
  // A soft pool of light so the droplet is not floating on bare white.
  heroGlow: {
    position: 'absolute',
    width: MASCOT_SIZE * 1.3,
    height: MASCOT_SIZE * 1.3,
    borderRadius: MASCOT_SIZE,
    backgroundColor: color.accentWash,
    opacity: 0.55,
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
  customAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  customLabel: {
    marginTop: 1,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  entryDrop: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.accentWash,
  },
  entryText: {
    flex: 1,
    gap: 1,
  },
  undoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.surface,
  },
  undoButtonPressed: {
    backgroundColor: palette.water100,
  },
  divider: {
    height: 1,
    backgroundColor: color.border,
  },
});
