/**
 * SQLite database client.
 *
 * Exports a single `db` instance using better-sqlite3 + Drizzle.
 * This module is server-only — never import it in client-side code
 * or Svelte components directly.
 *
 * The database file is created automatically on first use.
 */

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

import * as schema from "./schema";
import { ensureDatabasePath } from "./path";

const sqlite = new Database(ensureDatabasePath());

/** Drizzle database instance. Server-side only. */
export const db = drizzle(sqlite, { schema });
