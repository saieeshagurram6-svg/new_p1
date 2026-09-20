import { getDatabase } from '@/db/client';
import { buildGoalPeriod, type GoalPeriodInput } from '@/domain/goals';
import type { Goal, GoalStatus, LocalDate } from '@/domain/types';
import { createId } from '@/utils/id';

interface GoalRow {
  id: string;
  daily_goal_ml: number;
  start_date: string;
  end_date: string;
  duration_days: number;
  status: string;
  created_at: number;
  recommendation_source: string | null;
}

function toGoal(row: GoalRow): Goal {
  return {
    id: row.id,
    dailyGoalMl: row.daily_goal_ml,
    startDate: row.start_date,
    endDate: row.end_date,
    durationDays: row.duration_days,
    status: row.status as GoalStatus,
    createdAt: row.created_at,
    recommendationSource: row.recommendation_source,
  };
}

export async function getActiveGoal(): Promise<Goal | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<GoalRow>(
    `SELECT * FROM goal WHERE status = 'active' ORDER BY created_at DESC LIMIT 1;`,
  );
  return row ? toGoal(row) : null;
}

export async function getGoalById(id: string): Promise<Goal | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<GoalRow>('SELECT * FROM goal WHERE id = ?;', [id]);
  return row ? toGoal(row) : null;
}

export async function listGoals(): Promise<Goal[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<GoalRow>('SELECT * FROM goal ORDER BY created_at DESC;');
  return rows.map(toGoal);
}

/**
 * 11 — "Only one goal can be active." Creating a goal closes any open period
 * first, inside one transaction so we can never end up with two active goals.
 */
export async function createGoal(input: GoalPeriodInput): Promise<Goal> {
  const db = await getDatabase();
  const goal = buildGoalPeriod(input, createId('goal'));

  await db.withTransactionAsync(async () => {
    await db.runAsync(`UPDATE goal SET status = 'ended' WHERE status = 'active';`);
    await db.runAsync(
      `INSERT INTO goal (id, daily_goal_ml, start_date, end_date, duration_days, status, created_at, recommendation_source)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        goal.id,
        goal.dailyGoalMl,
        goal.startDate,
        goal.endDate,
        goal.durationDays,
        goal.status,
        goal.createdAt,
        goal.recommendationSource,
      ],
    );
  });

  return goal;
}

/**
 * Freezes a goal period once its final day has passed. The period is recorded
 * as it actually happened — 11 forbids silently rewriting or extending it.
 */
export async function closeGoal(goalId: string, status: Exclude<GoalStatus, 'active'>): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE goal SET status = ? WHERE id = ?;', [status, goalId]);
}

export async function getGoalForDate(date: LocalDate): Promise<Goal | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<GoalRow>(
    `SELECT * FROM goal WHERE start_date <= ? AND end_date >= ? ORDER BY created_at DESC LIMIT 1;`,
    [date, date],
  );
  return row ? toGoal(row) : null;
}
