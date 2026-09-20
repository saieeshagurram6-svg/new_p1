/**
 * Application state — Product Bible 16.
 *
 * "Persistent domain state lives in the database. Transient UI state lives in
 * React state. Do not put every database field into a global store."
 *
 * So this provider holds exactly the slice every screen needs — profile,
 * settings, the one active goal, and today's hydration — and exposes actions
 * that write through the repositories and then refresh from them. The database
 * stays the single source of truth; this is a cache with a refresh button.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { resetDatabase } from '@/db/client';
import { todayLocal } from '@/domain/date';
import { completionRatio, isDayComplete } from '@/domain/hydration';
import { goalDayNumber, hasGoalPeriodElapsed } from '@/domain/goals';
import type {
  AppSettings,
  DailyHydration,
  Goal,
  LocalDate,
  UserProfile,
  WaterEntry,
  WaterEntrySource,
} from '@/domain/types';
import * as goalRepository from '@/repositories/goalRepository';
import * as hydrationRepository from '@/repositories/hydrationRepository';
import { clearProfile } from '@/repositories/profileRepository';
import { getSettings, updateSettings as persistSettings } from '@/repositories/settingsRepository';
import { getAuthProvider, type SignInRequest } from '@/services/authService';
import { setHapticsEnabled } from '@/utils/haptics';
import { useSystemReduceMotion } from '@/utils/motion';

export interface LogWaterOutcome {
  justCompleted: boolean;
  daily: DailyHydration;
}

interface AppStateValue {
  /** False until the database, profile, settings and today's record are loaded. */
  ready: boolean;
  /** Set when bootstrap failed; screens show a retry rather than a blank app. */
  bootstrapError: string | null;

  profile: UserProfile | null;
  settings: AppSettings;
  activeGoal: Goal | null;
  today: LocalDate;
  daily: DailyHydration | null;
  entries: WaterEntry[];

  /** Derived for convenience — see Product Bible 09. */
  consumedMl: number;
  goalMl: number;
  progress: number;
  goalReached: boolean;
  goalDay: number;
  /** True once the active goal's final day has passed (06 goal-end flow). */
  goalPeriodElapsed: boolean;

  /** OS preference OR the in-app toggle. */
  reduceMotion: boolean;

  signIn(request: SignInRequest): Promise<UserProfile>;
  signOut(): Promise<void>;
  startGoal(input: { dailyGoalMl: number; durationDays: number }): Promise<Goal>;
  logWater(amountMl: number, source: WaterEntrySource): Promise<LogWaterOutcome>;
  undoLastEntry(): Promise<void>;
  updateSettings(patch: Partial<AppSettings>): Promise<void>;
  resetLocalData(): Promise<void>;
  refresh(): Promise<void>;
}

const AppStateContext = createContext<AppStateValue | null>(null);

const FALLBACK_SETTINGS: AppSettings = {
  notificationsEnabled: true,
  quietStart: '22:00',
  quietEnd: '07:00',
  reduceMotion: false,
  hapticsEnabled: true,
  quickAddMl: [150, 250, 500],
  postGoalRemindersEnabled: false,
  onboardingCompleted: false,
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<AppSettings>(FALLBACK_SETTINGS);
  const [activeGoal, setActiveGoal] = useState<Goal | null>(null);
  const [today, setToday] = useState<LocalDate>(todayLocal());
  const [daily, setDaily] = useState<DailyHydration | null>(null);
  const [entries, setEntries] = useState<WaterEntry[]>([]);

  const systemReduceMotion = useSystemReduceMotion();
  const loadingRef = useRef(false);

  /**
   * Single load path, used by bootstrap, by pull-to-refresh and by foregrounding.
   * Re-reading the date here is what makes midnight rollover safe.
   */
  const load = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    try {
      const [loadedSettings, loadedProfile] = await Promise.all([
        getSettings(),
        getAuthProvider().restore(),
      ]);

      let goal = await goalRepository.getActiveGoal();
      const date = todayLocal();

      // 11 — a goal period is frozen once its final day has passed. It is closed
      // here rather than rewritten or extended.
      if (goal && hasGoalPeriodElapsed(goal, date)) {
        await goalRepository.closeGoal(goal.id, 'completed');
        goal = null;
      }

      const record = await hydrationRepository.ensureDailyRecord(date, goal);
      const dayEntries = await hydrationRepository.listEntriesForDate(date);

      setSettings(loadedSettings);
      setHapticsEnabled(loadedSettings.hapticsEnabled);
      setProfile(loadedProfile);
      setActiveGoal(goal);
      setToday(date);
      setDaily(record);
      setEntries(dayEntries);
      setBootstrapError(null);
    } catch (error) {
      setBootstrapError(error instanceof Error ? error.message : 'Could not open local storage.');
    } finally {
      loadingRef.current = false;
      setReady(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // 20 — "The app handles missing data, app restarts and date changes safely."
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (status: AppStateStatus) => {
      if (status === 'active') void load();
    });
    return () => subscription.remove();
  }, [load]);

  const refreshToday = useCallback(async (goal: Goal | null) => {
    const date = todayLocal();
    const record = await hydrationRepository.ensureDailyRecord(date, goal);
    const dayEntries = await hydrationRepository.listEntriesForDate(date);
    setToday(date);
    setDaily(record);
    setEntries(dayEntries);
  }, []);

  const signIn = useCallback(async (request: SignInRequest) => {
    const next = await getAuthProvider().signIn(request);
    setProfile(next);
    return next;
  }, []);

  const signOut = useCallback(async () => {
    await clearProfile();
    setProfile(null);
  }, []);

  const startGoal = useCallback(
    async (input: { dailyGoalMl: number; durationDays: number }) => {
      const goal = await goalRepository.createGoal(input);
      setActiveGoal(goal);
      await refreshToday(goal);
      return goal;
    },
    [refreshToday],
  );

  const logWater = useCallback(
    async (amountMl: number, source: WaterEntrySource): Promise<LogWaterOutcome> => {
      const result = await hydrationRepository.logWater({ amountMl, source, goal: activeGoal });
      setDaily(result.daily);
      setEntries((current) => [...current, result.entry]);
      return { justCompleted: result.justCompleted, daily: result.daily };
    },
    [activeGoal],
  );

  const undoLastEntry = useCallback(async () => {
    const record = await hydrationRepository.undoLastEntry(today);
    if (record) setDaily(record);
    setEntries(await hydrationRepository.listEntriesForDate(today));
  }, [today]);

  const updateSettings = useCallback(async (patch: Partial<AppSettings>) => {
    const next = await persistSettings(patch);
    setSettings(next);
    setHapticsEnabled(next.hapticsEnabled);
  }, []);

  const resetLocalData = useCallback(async () => {
    await resetDatabase();
    setProfile(null);
    setActiveGoal(null);
    setDaily(null);
    setEntries([]);
    setSettings(FALLBACK_SETTINGS);
    await load();
  }, [load]);

  const value = useMemo<AppStateValue>(() => {
    const goalMl = daily?.goalMl ?? activeGoal?.dailyGoalMl ?? 0;
    const consumedMl = daily?.consumedMl ?? 0;

    return {
      ready,
      bootstrapError,
      profile,
      settings,
      activeGoal,
      today,
      daily,
      entries,
      consumedMl,
      goalMl,
      progress: completionRatio(consumedMl, goalMl),
      goalReached: isDayComplete(consumedMl, goalMl),
      goalDay: activeGoal ? goalDayNumber(activeGoal, today) : 0,
      goalPeriodElapsed: activeGoal ? hasGoalPeriodElapsed(activeGoal, today) : false,
      reduceMotion: systemReduceMotion || settings.reduceMotion,
      signIn,
      signOut,
      startGoal,
      logWater,
      undoLastEntry,
      updateSettings,
      resetLocalData,
      refresh: load,
    };
  }, [
    ready,
    bootstrapError,
    profile,
    settings,
    activeGoal,
    today,
    daily,
    entries,
    systemReduceMotion,
    signIn,
    signOut,
    startGoal,
    logWater,
    undoLastEntry,
    updateSettings,
    resetLocalData,
    load,
  ]);

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateValue {
  const value = useContext(AppStateContext);
  if (!value) throw new Error('useAppState must be used inside <AppProvider>.');
  return value;
}
