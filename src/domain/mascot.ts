/**
 * Mascot state selection — Product Bible 07 core-states table.
 *
 * The triggers live here, away from the drawing, so Home does not hand-roll
 * "which face now?" logic and so the rules can be tested on their own.
 */

import type { MascotState } from '@/components/Mascot';

/** Long gap before an eligible reminder -> `thirsty` (07). */
export const THIRSTY_AFTER_MS = 3 * 60 * 60 * 1000;

export interface MascotContext {
  goalReached: boolean;
  /** True on the log that just crossed the target, or a fresh badge. */
  celebrating?: boolean;
  /** True for the moment right after a log. */
  justLogged?: boolean;
  /** Epoch ms of the most recent entry today, if any. */
  lastEntryAt?: number | null;
  /** True once a goal period has ended without the target being met (11). */
  goalPeriodMissed?: boolean;
  now?: number;
  hour?: number;
}

export function selectMascotState(context: MascotContext): MascotState {
  const now = context.now ?? Date.now();
  const hour = context.hour ?? new Date(now).getHours();

  if (context.goalPeriodMissed) return 'sad';
  if (context.celebrating || context.goalReached) return 'celebrating';
  if (context.justLogged) return 'happy';

  // Optional late-night state. Deliberately checked before `thirsty` so the app
  // does not nag with a thirsty face at 2am.
  if (hour >= 23 || hour < 5) return 'sleepy';

  if (context.lastEntryAt && now - context.lastEntryAt > THIRSTY_AFTER_MS) return 'thirsty';
  if (!context.lastEntryAt && hour >= 11) return 'thirsty';

  return 'idle';
}
