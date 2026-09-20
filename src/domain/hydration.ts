/**
 * Hydration maths — Product Bible 09.
 *
 *   completionPercent = min(consumedAmount / dailyGoalAmount, 1) x 100
 *
 * The glass clamps at 100% while the underlying data keeps recording extra
 * water (06.11 — "Allow extra logging without increasing the daily goal").
 */

import type { WaterEntry } from './types';

/** Largest single entry we accept, guarding typos in the custom sheet (06.10). */
export const MAX_ENTRY_ML = 3000;
export const MIN_ENTRY_ML = 1;

/** Goal presets from 06.4, in millilitres. */
export const GOAL_PRESETS_ML = [1500, 2000, 2500, 3000] as const;

/** Quick-add presets from 06.9. */
export const DEFAULT_QUICK_ADD_ML = [150, 250, 500] as const;

/** Goal durations from 06.5, in days. */
export const DURATION_PRESETS_DAYS = [3, 7, 14, 30] as const;

export const MIN_GOAL_ML = 500;
export const MAX_GOAL_ML = 6000;
export const MIN_DURATION_DAYS = 1;
export const MAX_DURATION_DAYS = 365;

/** A glass-equivalent, used for the "Century of Glasses" badge (12). */
export const GLASS_EQUIVALENT_ML = 250;

/** Ratio in [0, 1]. Use this to drive the glass fill. */
export function completionRatio(consumedMl: number, goalMl: number): number {
  if (goalMl <= 0) return 0;
  return Math.min(consumedMl / goalMl, 1);
}

/** Whole percent in [0, 100], for display and for the stored day record. */
export function completionPercent(consumedMl: number, goalMl: number): number {
  return Math.round(completionRatio(consumedMl, goalMl) * 100);
}

/** 11 — a day succeeds at 100% of that day's target. One explicit rule. */
export function isDayComplete(consumedMl: number, goalMl: number): boolean {
  return goalMl > 0 && consumedMl >= goalMl;
}

export function remainingMl(consumedMl: number, goalMl: number): number {
  return Math.max(goalMl - consumedMl, 0);
}

export function sumEntries(entries: readonly WaterEntry[]): number {
  return entries.reduce((total, entry) => total + entry.amountMl, 0);
}

export interface AmountValidation {
  ok: boolean;
  /** Present when `ok` is false — user-facing, never scolding. */
  message?: string;
  /** The value to persist when `ok` is true. */
  value?: number;
}

/** 06.10 — "Validate positive amount and reasonable maximum per entry." */
export function validateEntryAmount(raw: string | number): AmountValidation {
  const parsed = typeof raw === 'number' ? raw : Number(String(raw).trim());
  if (!Number.isFinite(parsed)) {
    return { ok: false, message: 'Enter an amount in millilitres.' };
  }
  const value = Math.round(parsed);
  if (value < MIN_ENTRY_ML) {
    return { ok: false, message: 'That needs to be more than zero.' };
  }
  if (value > MAX_ENTRY_ML) {
    return { ok: false, message: `Single entries top out at ${MAX_ENTRY_ML} ml.` };
  }
  return { ok: true, value };
}

export function validateGoalAmount(raw: string | number): AmountValidation {
  const parsed = typeof raw === 'number' ? raw : Number(String(raw).trim());
  if (!Number.isFinite(parsed)) {
    return { ok: false, message: 'Enter a daily target in millilitres.' };
  }
  const value = Math.round(parsed);
  if (value < MIN_GOAL_ML) {
    return { ok: false, message: `Daily targets start at ${MIN_GOAL_ML} ml.` };
  }
  if (value > MAX_GOAL_ML) {
    return { ok: false, message: `Daily targets top out at ${MAX_GOAL_ML / 1000} L.` };
  }
  return { ok: true, value };
}

/** "2.5 L" above a litre, "750 ml" below it. */
export function formatVolume(ml: number): string {
  if (ml >= 1000) {
    const litres = ml / 1000;
    const text = Number.isInteger(litres) ? litres.toFixed(1) : litres.toFixed(2).replace(/0$/, '');
    return `${text} L`;
  }
  return `${Math.round(ml)} ml`;
}

export function formatMl(ml: number): string {
  return `${Math.round(ml)} ml`;
}
