/**
 * SQLite database client.
 *
 * Lazily initializes Drizzle + better-sqlite3 on first server-side access.
 * This module is server-only — never import it in client-side code.
 */

import { createRequire } from "node:module";

import { drizzle } from "drizzle-orm/better-sqlite3";

import * as schema from "./schema";
import { ensureDatabasePath, resolveDatabaseFilePath } from "./path";

const require = createRequire(import.meta.url);

let db: ReturnType<typeof drizzle> | null = null;
let initAttempted = false;

function loadDatabaseConstructor(): typeof import("better-sqlite3") {
	return require("better-sqlite3") as typeof import("better-sqlite3");
}

/** Returns a singleton Drizzle instance, or null if SQLite is unavailable. */
export function getDb(): ReturnType<typeof drizzle> | null {
	if (db) {
		return db;
	}

	if (initAttempted) {
		return null;
	}

	initAttempted = true;

	try {
		const Database = loadDatabaseConstructor();
		const sqlite = new Database(ensureDatabasePath());
		db = drizzle(sqlite, { schema });
		return db;
	} catch (error) {
		console.error(
			`[db] SQLite initialization failed for ${resolveDatabaseFilePath()}. Persistence is disabled.`,
			error
		);
		return null;
	}
}
