/**
 * Database initialization.
 * Creates the analyses table if it does not exist.
 * Safe to call on every server start — idempotent.
 *
 * Call this from the SvelteKit hooks file on startup.
 */

import Database from "better-sqlite3";

/** Creates the analyses table if it does not already exist. */
export function initDb(): void {
  const sqlite = new Database("db/thought-structure.db");

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS analyses (
      id                 TEXT    PRIMARY KEY,
      input_text         TEXT    NOT NULL,
      analysis_json      TEXT    NOT NULL,
      extraction_quality TEXT    NOT NULL,
      created_at         INTEGER NOT NULL
    )
  `);

  sqlite.close();
}
