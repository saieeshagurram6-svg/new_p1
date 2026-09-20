/**
 * History — Product Bible 06.12 / 06.13.
 *
 * Phase 4 scope. The calendar of completion droplets, day detail and the entry
 * timeline are not built yet; what this screen shows is real data read through
 * the same repository the calendar will use, so the surface is honest about
 * what exists rather than mocking a month of fake droplets.
 */

import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Body, BodyStrong, Caption, Card, Spacer, Title } from '@/components/ui';
import { addDays, formatDayLabel, todayLocal } from '@/domain/date';
import { formatVolume } from '@/domain/hydration';
import type { DailyHydration } from '@/domain/types';
import { listDailyRecords } from '@/repositories/hydrationRepository';
import { color, radius, spacing } from '@/theme';

const WINDOW_DAYS = 14;

export default function HistoryScreen() {
  const [records, setRecords] = useState<DailyHydration[]>([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const today = todayLocal();
      void listDailyRecords(addDays(today, -(WINDOW_DAYS - 1)), today).then((rows) => {
        if (active) setRecords(rows.slice().reverse());
      });
      return () => {
        active = false;
      };
    }, []),
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Title>History</Title>
        <Caption tone="muted">The last {WINDOW_DAYS} days you logged.</Caption>
        <Spacer size={spacing.lg} />

        {records.length === 0 ? (
          <Card>
            <Body tone="secondary">
              Nothing here yet. Log your first drink and this fills in from tomorrow.
            </Body>
          </Card>
        ) : (
          <Card>
            {records.map((record, index) => (
              <View key={record.date}>
                {index > 0 ? <View style={styles.divider} /> : null}
                <View style={styles.row}>
                  <Droplet percent={record.completionPercent} />
                  <View style={styles.rowText}>
                    <BodyStrong>{formatDayLabel(record.date)}</BodyStrong>
                    <Caption tone="muted">
                      {formatVolume(record.consumedMl)} of {formatVolume(record.goalMl)} ·{' '}
                      {record.completionPercent}%
                    </Caption>
                  </View>
                </View>
              </View>
            ))}
          </Card>
        )}

        <Spacer size={spacing.lg} />
        <Card style={styles.pending}>
          <Caption tone="muted">Coming in Phase 4</Caption>
          <Spacer size={spacing.xs} />
          <Body tone="secondary">
            The month calendar of completion droplets, tap-through day detail and the per-entry
            timeline.
          </Body>
        </Card>
        <Spacer size={spacing.xxl} />
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * 06.12 — "Each day uses a water droplet whose fill represents completion
 * percentage... Do not use aggressive red failure states."
 */
function Droplet({ percent }: { percent: number }) {
  const fill = Math.max(0, Math.min(percent, 100)) / 100;
  return (
    <View style={styles.droplet}>
      <View style={[styles.dropletFill, { height: `${fill * 100}%` }]} />
    </View>
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.sm,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  divider: {
    height: 1,
    backgroundColor: color.border,
  },
  droplet: {
    width: 26,
    height: 32,
    borderRadius: 13,
    borderTopLeftRadius: 4,
    borderWidth: 1.5,
    borderColor: color.accentSoft,
    backgroundColor: color.surface,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    transform: [{ rotate: '45deg' }],
  },
  dropletFill: {
    backgroundColor: color.waterBody,
  },
  pending: {
    backgroundColor: color.surfaceSunk,
    borderRadius: radius.lg,
  },
});
