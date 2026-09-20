import assert from 'node:assert/strict';

import { addDays, daysBetween, toLocalDate, fromLocalDate } from '../src/domain/date';
import {
  completionPercent,
  completionRatio,
  formatVolume,
  isDayComplete,
  remainingMl,
  validateEntryAmount,
  validateGoalAmount,
} from '../src/domain/hydration';
import {
  buildGoalPeriod,
  goalDayNumber,
  hasGoalPeriodElapsed,
  isDateInGoalPeriod,
} from '../src/domain/goals';

let passed = 0;
const check = (name: string, fn: () => void) => {
  fn();
  passed += 1;
  console.log(`  ok  ${name}`);
};

console.log('Product Bible 09 — hydration maths');

check('worked example: 250+500+250+300 of 2500 => 52%', () => {
  const consumed = 250 + 500 + 250 + 300;
  assert.equal(consumed, 1300);
  assert.equal(completionPercent(consumed, 2500), 52);
});

check('glass clamps at 100% while data keeps recording', () => {
  assert.equal(completionRatio(4000, 2000), 1);
  assert.equal(completionPercent(4000, 2000), 100);
  assert.equal(remainingMl(4000, 2000), 0);
});

check('a day completes at exactly 100%, not before', () => {
  assert.equal(isDayComplete(1999, 2000), false);
  assert.equal(isDayComplete(2000, 2000), true);
  assert.equal(isDayComplete(2001, 2000), true);
});

check('zero goal never divides by zero', () => {
  assert.equal(completionRatio(500, 0), 0);
  assert.equal(isDayComplete(500, 0), false);
});

check('entry validation rejects junk, zero and absurd amounts', () => {
  assert.equal(validateEntryAmount('abc').ok, false);
  assert.equal(validateEntryAmount('0').ok, false);
  assert.equal(validateEntryAmount('-50').ok, false);
  assert.equal(validateEntryAmount('99999').ok, false);
  assert.deepEqual(validateEntryAmount('250').value, 250);
  assert.deepEqual(validateEntryAmount(' 330 ').value, 330);
});

check('goal validation holds the documented bounds', () => {
  assert.equal(validateGoalAmount('100').ok, false);
  assert.equal(validateGoalAmount('9000').ok, false);
  assert.equal(validateGoalAmount('2500').value, 2500);
});

check('volume formatting switches at a litre', () => {
  assert.equal(formatVolume(750), '750 ml');
  assert.equal(formatVolume(2000), '2.0 L');
  assert.equal(formatVolume(2500), '2.5 L');
});

console.log('\nProduct Bible 11 — goal periods');

check('a 3-day goal starting today ends on day 3, inclusive', () => {
  const goal = buildGoalPeriod({ dailyGoalMl: 2000, durationDays: 3, startDate: '2026-09-21' }, 'g1');
  assert.equal(goal.startDate, '2026-09-21');
  assert.equal(goal.endDate, '2026-09-23');
  assert.equal(goal.status, 'active');
});

check('day numbering is 1-based and clamped to the period', () => {
  const goal = buildGoalPeriod({ dailyGoalMl: 2000, durationDays: 7, startDate: '2026-09-21' }, 'g2');
  assert.equal(goalDayNumber(goal, '2026-09-21'), 1);
  assert.equal(goalDayNumber(goal, '2026-09-24'), 4);
  assert.equal(goalDayNumber(goal, '2026-09-27'), 7);
  assert.equal(goalDayNumber(goal, '2026-10-05'), 7, 'clamps past the end');
  assert.equal(goalDayNumber(goal, '2026-09-01'), 1, 'clamps before the start');
});

check('period membership and elapse are exact at the boundaries', () => {
  const goal = buildGoalPeriod({ dailyGoalMl: 2000, durationDays: 7, startDate: '2026-09-21' }, 'g3');
  assert.equal(isDateInGoalPeriod(goal, '2026-09-20'), false);
  assert.equal(isDateInGoalPeriod(goal, '2026-09-21'), true);
  assert.equal(isDateInGoalPeriod(goal, '2026-09-27'), true);
  assert.equal(isDateInGoalPeriod(goal, '2026-09-28'), false);

  assert.equal(hasGoalPeriodElapsed(goal, '2026-09-27'), false, 'final day is still live');
  assert.equal(hasGoalPeriodElapsed(goal, '2026-09-28'), true);
});

console.log('\nLocal-date handling (no UTC drift)');

check('a late-night local time stays on its own local day', () => {
  // 23:30 local on 21 Sep. toISOString() would roll this to the 22nd in any
  // timezone east of UTC-0:30.
  const lateNight = new Date(2026, 8, 21, 23, 30, 0);
  assert.equal(toLocalDate(lateNight), '2026-09-21');
});

check('an early-morning local time stays on its own local day', () => {
  const earlyMorning = new Date(2026, 8, 21, 0, 15, 0);
  assert.equal(toLocalDate(earlyMorning), '2026-09-21');
});

check('date arithmetic survives a month boundary and a DST shift', () => {
  assert.equal(addDays('2026-09-30', 1), '2026-10-01');
  assert.equal(addDays('2026-01-31', 1), '2026-02-01');
  assert.equal(addDays('2026-03-08', 1), '2026-03-09', 'US DST spring-forward');
  assert.equal(addDays('2026-10-25', 1), '2026-10-26', 'EU DST fall-back');
  assert.equal(daysBetween('2026-09-21', '2026-09-28'), 7);
  assert.equal(daysBetween('2026-09-28', '2026-09-21'), -7);
});

check('round-trips through Date without shifting', () => {
  for (const date of ['2026-01-01', '2026-03-08', '2026-06-15', '2026-10-25', '2026-12-31']) {
    assert.equal(toLocalDate(fromLocalDate(date)), date, `round-trip ${date}`);
  }
});

console.log(`\n${passed} checks passed.`);
