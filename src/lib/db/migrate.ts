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
      )
    `);

    sqlite.close();
  } catch (error) {
    console.error("[db] Failed to initialize the SQLite schema. Continuing without persistence.", error);
  }
}
