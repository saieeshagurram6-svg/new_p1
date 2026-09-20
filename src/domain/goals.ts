/**
 * Goal period logic — Product Bible 06.5 and 11.
 *
 * Only one goal is active at a time. Changing a goal closes the old period and
 * opens a new immutable one; historical days keep the goal that applied on the
 * date they were recorded.
 */

import { addDays, compareDates, daysBetween, todayLocal } from './date';
import type { Goal, LocalDate } from './types';

export interface GoalPeriodInput {
  dailyGoalMl: number;
  durationDays: number;
  startDate?: LocalDate;
  recommendationSource?: string | null;
}

export function buildGoalPeriod(input: GoalPeriodInput, id: string, now = Date.now()): Goal {
  const startDate = input.startDate ?? todayLocal();
  return {
    id,
    dailyGoalMl: input.dailyGoalMl,
    startDate,
    // A 3-day goal starting today ends the day after tomorrow, inclusive.
    endDate: addDays(startDate, input.durationDays - 1),
    durationDays: input.durationDays,
    status: 'active',
    createdAt: now,
    recommendationSource: input.recommendationSource ?? null,
  };
}

/** 1-based day index within the goal period; clamped to the period length. */
export function goalDayNumber(goal: Goal, date: LocalDate = todayLocal()): number {
  const offset = daysBetween(goal.startDate, date);
  return Math.min(Math.max(offset + 1, 1), goal.durationDays);
}

export function isDateInGoalPeriod(goal: Goal, date: LocalDate = todayLocal()): boolean {
  return compareDates(date, goal.startDate) >= 0 && compareDates(date, goal.endDate) <= 0;
}

/** True once the calendar has moved past the goal's final day. */
export function hasGoalPeriodElapsed(goal: Goal, date: LocalDate = todayLocal()): boolean {
  return compareDates(date, goal.endDate) > 0;
}

export function daysRemaining(goal: Goal, date: LocalDate = todayLocal()): number {
  return Math.max(daysBetween(date, goal.endDate), 0);
}

/**
 * Whether a day's stored goal stamp should be (re)written.
 *
 * Section 11 forbids recalculating an old day with today's goal, but two rows
 * legitimately need stamping:
 *
 *  - A placeholder created before any goal existed. The app materialises
 *    today's row on launch, so a first run writes `goal_ml = 0` before
 *    onboarding produces a goal. That is an unstamped row, not history.
 *  - Today's row when a new goal period begins. A new period starts today, so
 *    today belongs to it.
 *
 * A day before the goal's start date is history and is never touched.
 */
export function shouldStampGoalOnDay(params: {
  date: LocalDate;
  rowGoalId: string | null;
  rowGoalMl: number;
  goal: Goal | null;
}): boolean {
  const { date, rowGoalId, rowGoalMl, goal } = params;
  if (!goal) return false;

  // Already correct.
  if (rowGoalId === goal.id && rowGoalMl === goal.dailyGoalMl) return false;

  // An unstamped placeholder can always adopt the goal that now applies.
  if (rowGoalId === null || rowGoalMl <= 0) return true;

  // Otherwise only days inside the goal's own period may be stamped, which
  // leaves every day that preceded it untouched.
  return compareDates(date, goal.startDate) >= 0;
}

export function describeDuration(days: number): string {
  if (days === 1) return '1 day';
  if (days === 7) return '1 week';
  if (days === 14) return '2 weeks';
  if (days === 30) return '30 days';
  return `${days} days`;
}
