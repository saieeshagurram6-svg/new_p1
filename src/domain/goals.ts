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

export function describeDuration(days: number): string {
  if (days === 1) return '1 day';
  if (days === 7) return '1 week';
  if (days === 14) return '2 weeks';
  if (days === 30) return '30 days';
  return `${days} days`;
}
