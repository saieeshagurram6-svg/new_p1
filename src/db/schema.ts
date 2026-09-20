/**
 * Local database schema — Product Bible 13.
 *
 * Migrations are an ordered, append-only list. Each entry runs exactly once and
 * `user_version` records how far we've got, so an app update never re-runs a
 * step or loses a user's history.
 *
 * Tables for later phases (notification_event, achievement, streak) are created
 * now so Phase 3/4 can fill them without a migration that touches live data.
 */

export interface Migration {
  readonly id: number;
  readonly statements: readonly string[];
}

export const MIGRATIONS: readonly Migration[] = [
  {
    id: 1,
    statements: [
      `CREATE TABLE IF NOT EXISTS user_profile (
         id            TEXT PRIMARY KEY NOT NULL,
         display_name  TEXT,
         email         TEXT,
         provider      TEXT NOT NULL,
         created_at    INTEGER NOT NULL
       );`,

      `CREATE TABLE IF NOT EXISTS goal (
         id                     TEXT PRIMARY KEY NOT NULL,
         daily_goal_ml          INTEGER NOT NULL,
         start_date             TEXT NOT NULL,
         end_date               TEXT NOT NULL,
         duration_days          INTEGER NOT NULL,
         status                 TEXT NOT NULL,
         created_at             INTEGER NOT NULL,
         recommendation_source  TEXT
       );`,
      `CREATE INDEX IF NOT EXISTS idx_goal_status ON goal (status);`,

      // goal_ml is frozen per day: the historical integrity rule in section 11.
      `CREATE TABLE IF NOT EXISTS daily_hydration (
         date                TEXT PRIMARY KEY NOT NULL,
         goal_id             TEXT,
         goal_ml             INTEGER NOT NULL,
         consumed_ml         INTEGER NOT NULL DEFAULT 0,
         completed           INTEGER NOT NULL DEFAULT 0,
         completion_percent  INTEGER NOT NULL DEFAULT 0,
         entry_count         INTEGER NOT NULL DEFAULT 0,
         first_entry_at      INTEGER,
         last_entry_at       INTEGER,
         FOREIGN KEY (goal_id) REFERENCES goal (id)
       );`,

      `CREATE TABLE IF NOT EXISTS water_entry (
         id          TEXT PRIMARY KEY NOT NULL,
         date        TEXT NOT NULL,
         amount_ml   INTEGER NOT NULL,
         logged_at   INTEGER NOT NULL,
         source      TEXT NOT NULL,
         created_at  INTEGER NOT NULL
       );`,
      `CREATE INDEX IF NOT EXISTS idx_water_entry_date ON water_entry (date, logged_at);`,

      `CREATE TABLE IF NOT EXISTS container_preset (
         id         TEXT PRIMARY KEY NOT NULL,
         name       TEXT NOT NULL,
         volume_ml  INTEGER NOT NULL,
         enabled    INTEGER NOT NULL DEFAULT 1
       );`,

      // Single-row settings table; the CHECK keeps it that way.
      `CREATE TABLE IF NOT EXISTS app_settings (
         id                          INTEGER PRIMARY KEY CHECK (id = 1),
         notifications_enabled       INTEGER NOT NULL DEFAULT 1,
         quiet_start                 TEXT NOT NULL DEFAULT '22:00',
         quiet_end                   TEXT NOT NULL DEFAULT '07:00',
         reduce_motion               INTEGER NOT NULL DEFAULT 0,
         haptics_enabled             INTEGER NOT NULL DEFAULT 1,
         quick_add_ml                TEXT NOT NULL DEFAULT '150,250,500',
         post_goal_reminders_enabled INTEGER NOT NULL DEFAULT 0,
         onboarding_completed        INTEGER NOT NULL DEFAULT 0
       );`,

      // Reserved for Phase 3 (notification engine).
      `CREATE TABLE IF NOT EXISTS notification_event (
         id            TEXT PRIMARY KEY NOT NULL,
         scheduled_at  INTEGER NOT NULL,
         shown_at      INTEGER,
         action        TEXT,
         related_date  TEXT,
         reason        TEXT
       );`,

      // Reserved for Phase 4 (history & motivation).
      `CREATE TABLE IF NOT EXISTS streak_state (
         id                    INTEGER PRIMARY KEY CHECK (id = 1),
         current               INTEGER NOT NULL DEFAULT 0,
         longest               INTEGER NOT NULL DEFAULT 0,
         last_successful_date  TEXT
       );`,
      `CREATE TABLE IF NOT EXISTS user_achievement (
         achievement_id  TEXT PRIMARY KEY NOT NULL,
         earned_at       INTEGER NOT NULL
       );`,
    ],
  },
];

export const LATEST_SCHEMA_VERSION = MIGRATIONS[MIGRATIONS.length - 1].id;
