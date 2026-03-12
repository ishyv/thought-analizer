/**
 * Database initialization.
 * Creates or upgrades the SQLite schema in place.
 * Safe to call on every server start — idempotent and best-effort.
 *
 * Call this from the SvelteKit hooks file on startup.
 */

import { createRequire } from "node:module";

import { ensureDatabasePath } from "./path";

const require = createRequire(import.meta.url);

function loadDatabaseConstructor(): typeof import("better-sqlite3") {
  return require("better-sqlite3") as typeof import("better-sqlite3");
}

function normalizeForCache(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, " ");
}

function getColumnNames(
  sqlite: import("better-sqlite3").Database,
  tableName: string
): Set<string> {
  const rows = sqlite
    .prepare(`PRAGMA table_info(${tableName})`)
    .all() as Array<{ name: string }>;

  return new Set(rows.map((row) => row.name));
}

function ensureAnalysesSchema(sqlite: import("better-sqlite3").Database): void {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS analyses (
      id                 TEXT    PRIMARY KEY,
      input_text         TEXT    NOT NULL,
      normalized_text    TEXT    NOT NULL,
      analysis_json      TEXT    NOT NULL,
      reading_json       TEXT,
      reframe_json       TEXT,
      extraction_quality TEXT    NOT NULL,
      created_at         INTEGER NOT NULL
    );
  `);

  const columns = getColumnNames(sqlite, "analyses");

  if (!columns.has("normalized_text")) {
    sqlite.exec(`ALTER TABLE analyses ADD COLUMN normalized_text TEXT NOT NULL DEFAULT '';`);

    const legacyRows = sqlite
      .prepare(`SELECT id, input_text FROM analyses WHERE normalized_text = '' OR normalized_text IS NULL`)
      .all() as Array<{ id: string; input_text: string }>;

    const updateNormalizedText = sqlite.prepare(
      `UPDATE analyses SET normalized_text = ? WHERE id = ?`
    );

    for (const row of legacyRows) {
      updateNormalizedText.run(normalizeForCache(row.input_text), row.id);
    }
  }

  if (!columns.has("reading_json")) {
    sqlite.exec(`ALTER TABLE analyses ADD COLUMN reading_json TEXT;`);
  }

  if (!columns.has("reframe_json")) {
    sqlite.exec(`ALTER TABLE analyses ADD COLUMN reframe_json TEXT;`);
  }

  sqlite.exec(`
    CREATE INDEX IF NOT EXISTS analyses_normalized_text_idx
      ON analyses (normalized_text);
  `);
}

function ensureRateLimitSchema(sqlite: import("better-sqlite3").Database): void {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS rate_limit_events (
      id          TEXT    PRIMARY KEY,
      user_key    TEXT    NOT NULL,
      route_key   TEXT    NOT NULL,
      decision    TEXT    NOT NULL,
      cost        INTEGER NOT NULL,
      input_chars INTEGER NOT NULL,
      created_at  INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS rate_limit_events_user_route_created_at_idx
      ON rate_limit_events (user_key, route_key, created_at);
  `);
}

/** Creates or upgrades the app schema if it does not already exist. */
export function initDb(): void {
  let sqlite: import("better-sqlite3").Database | null = null;

  try {
    const Database = loadDatabaseConstructor();
    sqlite = new Database(ensureDatabasePath());

    ensureAnalysesSchema(sqlite);
    ensureRateLimitSchema(sqlite);

    sqlite
      .prepare(`DELETE FROM rate_limit_events WHERE created_at < ?`)
      .run(Date.now() - 7 * 24 * 60 * 60 * 1000);
  } catch (error) {
    console.error("[db] Failed to initialize the SQLite schema. Continuing without persistence.", error);
  } finally {
    sqlite?.close();
  }
}
