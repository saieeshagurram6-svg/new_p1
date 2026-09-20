/**
 * Achievements — Product Bible 06.14 / 12.
 *
 * Phase 4 scope. The badge catalogue from section 12 is listed here with its
 * real unlock conditions so the surface is not empty, but the streak engine and
 * the earn/celebrate flow are not wired up yet — nothing on this screen claims
 * to be earned.
 */

import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { Body, BodyStrong, Caption, Card, Spacer, Title } from '@/components/ui';
import { color, radius, spacing } from '@/theme';

/** Badge catalogue, Product Bible 12. */
const BADGES = [
  { id: 'first_sip', name: 'First Sip', condition: 'First successful water entry' },
  { id: 'first_goal', name: 'First Goal', condition: 'First day reaching 100%' },
  { id: 'seven_day_flow', name: '7-Day Flow', condition: 'Seven successful days' },
  { id: 'thirty_day_flow', name: '30-Day Flow', condition: 'Thirty successful days' },
  { id: 'hydration_habit', name: 'Hydration Habit', condition: '100 total water entries' },
  { id: 'goal_crusher', name: 'Goal Crusher', condition: 'Complete a full goal period' },
  { id: 'century_of_glasses', name: 'Century of Glasses', condition: '100 glass-equivalents logged' },
];

export default function AchievementsScreen() {
  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Title>Achievements</Title>
        <Caption tone="muted">What AQUIS will be keeping an eye on.</Caption>
        <Spacer size={spacing.lg} />

        <Card style={styles.pending}>
          <Caption tone="muted">Coming in Phase 4</Caption>
          <Spacer size={spacing.xs} />
          <Body tone="secondary">
            Streak counting, badge unlocks and the celebration flow arrive with the history engine.
          </Body>
        </Card>

        <Spacer size={spacing.lg} />

        <Card>
          {BADGES.map((badge, index) => (
            <View key={badge.id}>
              {index > 0 ? <View style={styles.divider} /> : null}
              <View style={styles.row}>
                <View style={styles.badge}>
                  <Icon name="medal" size={20} color={color.textMuted} />
                </View>
                <View style={styles.rowText}>
                  <BodyStrong tone="secondary">{badge.name}</BodyStrong>
                  <Caption tone="muted">{badge.condition}</Caption>
                </View>
              </View>
            </View>
          ))}
        </Card>

        <Spacer size={spacing.xxl} />
      </ScrollView>
    </SafeAreaView>
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
  badge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.surfaceSunk,
  },
  pending: {
    backgroundColor: color.surfaceSunk,
    borderRadius: radius.lg,
  },
});
