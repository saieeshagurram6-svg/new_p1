/**
 * Database bootstrap.
 *
 * Screens never touch this module — they go through the repositories, per
 * Product Bible 13 ("the UI should read from a repository/data-access layer").
 */

import * as SQLite from 'expo-sqlite';
import { LATEST_SCHEMA_VERSION, MIGRATIONS } from './schema';

const DATABASE_NAME = 'aquis.db';

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function migrate(db: SQLite.SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
  const currentVersion = row?.user_version ?? 0;
  if (currentVersion >= LATEST_SCHEMA_VERSION) return;

  for (const migration of MIGRATIONS) {
    if (migration.id <= currentVersion) continue;
    await db.withTransactionAsync(async () => {
      for (const statement of migration.statements) {
        await db.execAsync(statement);
      }
    });
    // PRAGMA can't be parameterised, and `id` is a literal from our own list.
    await db.execAsync(`PRAGMA user_version = ${migration.id};`);
  }
}

async function open(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');
  await migrate(db);
  return db;
}

/** Idempotent: every caller shares one connection. */
export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = open().catch((error) => {
      // Don't cache a failed open — let the next caller retry.
      databasePromise = null;
      throw error;
    });
  }
  return databasePromise;
}

/** Profile / Settings screen: "Reset local data" (06.15). */
export async function resetDatabase(): Promise<void> {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await db.execAsync(`
      DELETE FROM water_entry;
      DELETE FROM daily_hydration;
      DELETE FROM goal;
      DELETE FROM user_achievement;
      DELETE FROM notification_event;
      DELETE FROM streak_state;
      DELETE FROM container_preset;
      DELETE FROM app_settings;
      DELETE FROM user_profile;
    `);
  });
}

export type { SQLiteDatabase } from 'expo-sqlite';
