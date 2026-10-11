import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import type { NeonQueryFunction } from "@neondatabase/serverless";
import * as schema from "./schema";

// Lazy initialization — avoids build-time errors when DATABASE_URL is absent
let _sql: NeonQueryFunction<false, false> | null = null;
let _db: ReturnType<typeof drizzle> | null = null;

export function getSql() {
  if (!_sql) {
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
    _sql = neon(process.env.DATABASE_URL);
  }
  return _sql;
}

export function getDb() {
  if (!_db) {
    _db = drizzle(getSql(), { schema });
  }
  return _db;
}

export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_, prop) {
    return (getDb() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export function sql(strings: TemplateStringsArray, ...values: unknown[]) {
  return getSql()(strings, ...values);
}

let scriptsTableReady = false;
let sessionsTableReady = false;

export async function ensureScriptsTable() {
  if (scriptsTableReady) return;
  const s = getSql();
  await s`
    CREATE TABLE IF NOT EXISTS scripts (
      id          SERIAL PRIMARY KEY,
      user_id     TEXT NOT NULL,
      title       TEXT NOT NULL,
      scenario    TEXT NOT NULL DEFAULT '',
      content     TEXT NOT NULL,
      word_count  INTEGER NOT NULL DEFAULT 0,
      duration    TEXT NOT NULL DEFAULT '',
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await s`CREATE INDEX IF NOT EXISTS scripts_user_id_idx ON scripts(user_id)`;
  scriptsTableReady = true;
}

export async function ensurePracticeSessionsTable() {
  if (sessionsTableReady) return;
  const s = getSql();
  await s`
    CREATE TABLE IF NOT EXISTS practice_sessions (
      id               SERIAL PRIMARY KEY,
      user_id          TEXT NOT NULL,
      scenario         TEXT NOT NULL DEFAULT '',
      transcript       TEXT NOT NULL DEFAULT '',
      scores           JSONB NOT NULL DEFAULT '{}',
      filler_words     JSONB NOT NULL DEFAULT '{}',
      wpm              INTEGER NOT NULL DEFAULT 0,
      duration_seconds INTEGER NOT NULL DEFAULT 0,
      strengths        JSONB NOT NULL DEFAULT '[]',
      improvements     JSONB NOT NULL DEFAULT '[]',
      ai_feedback      TEXT NOT NULL DEFAULT '',
      analysis         JSONB NOT NULL DEFAULT '{}',
      created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  // Backfill the analysis column for tables created before it existed
  await s`ALTER TABLE practice_sessions ADD COLUMN IF NOT EXISTS analysis JSONB NOT NULL DEFAULT '{}'`;
  await s`CREATE INDEX IF NOT EXISTS practice_sessions_user_id_idx ON practice_sessions(user_id)`;
  sessionsTableReady = true;
}

let c2TableReady = false;

export async function ensureC2SessionsTable() {
  if (c2TableReady) return;
  const s = getSql();
  await s`
    CREATE TABLE IF NOT EXISTS c2_sessions (
      id            SERIAL PRIMARY KEY,
      user_id       TEXT NOT NULL,
      scenario      TEXT NOT NULL DEFAULT '',
      challenge     TEXT NOT NULL DEFAULT '',
      current_level TEXT NOT NULL DEFAULT '',
      c2_readiness  INTEGER NOT NULL DEFAULT 0,
      scores        JSONB NOT NULL DEFAULT '{}',
      keeps_below   JSONB NOT NULL DEFAULT '[]',
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await s`CREATE INDEX IF NOT EXISTS c2_sessions_user_id_idx ON c2_sessions(user_id)`;
  c2TableReady = true;
}

let examTableReady = false;

export async function ensureExamSessionsTable() {
  if (examTableReady) return;
  const s = getSql();
  await s`
    CREATE TABLE IF NOT EXISTS exam_sessions (
      id               SERIAL PRIMARY KEY,
      user_id          TEXT NOT NULL,
      exam_id          TEXT NOT NULL DEFAULT '',
      exam_name        TEXT NOT NULL DEFAULT '',
      task_name        TEXT NOT NULL DEFAULT '',
      native_score     TEXT NOT NULL DEFAULT '',
      score_out_of_100 INTEGER NOT NULL DEFAULT 0,
      created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await s`CREATE INDEX IF NOT EXISTS exam_sessions_user_id_idx ON exam_sessions(user_id)`;
  examTableReady = true;
}

let recordingsTableReady = false;

// Practice recordings: audio is stored as bytea alongside its metadata.
export async function ensureRecordingsTable() {
  if (recordingsTableReady) return;
  const s = getSql();
  await s`
    CREATE TABLE IF NOT EXISTS recordings (
      id            SERIAL PRIMARY KEY,
      user_id       TEXT NOT NULL,
      scenario      TEXT NOT NULL DEFAULT '',
      transcript    TEXT NOT NULL DEFAULT '',
      duration      INTEGER NOT NULL DEFAULT 0,
      wpm           INTEGER NOT NULL DEFAULT 0,
      overall_score INTEGER NOT NULL DEFAULT 0,
      mime_type     TEXT NOT NULL DEFAULT 'audio/webm',
      size_bytes    INTEGER NOT NULL DEFAULT 0,
      audio         BYTEA NOT NULL,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await s`CREATE INDEX IF NOT EXISTS recordings_user_created_idx ON recordings(user_id, created_at DESC)`;
  recordingsTableReady = true;
}
