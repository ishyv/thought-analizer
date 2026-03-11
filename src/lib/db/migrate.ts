/**
 * Database initialization.
 * Creates the analyses table if it does not exist.
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

/** Creates the analyses table if it does not already exist. */
export function initDb(): void {
  try {
    const Database = loadDatabaseConstructor();
    const sqlite = new Database(ensureDatabasePath());

    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS analyses (
        id                 TEXT    PRIMARY KEY,
        input_text         TEXT    NOT NULL,
        analysis_json      TEXT    NOT NULL,
        extraction_quality TEXT    NOT NULL,
        created_at         INTEGER NOT NULL
      );

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

    sqlite
      .prepare(`DELETE FROM rate_limit_events WHERE created_at < ?`)
      .run(Date.now() - 7 * 24 * 60 * 60 * 1000);

    sqlite.close();
  } catch (error) {
    console.error("[db] Failed to initialize the SQLite schema. Continuing without persistence.", error);
  }
}
