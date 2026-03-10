/**
 * SvelteKit server hooks.
 * Runs once on server startup.
 */

import { initDb } from "$lib/db/migrate";

try {
	initDb();
} catch (error) {
	console.error("[db] Unexpected database startup failure. Continuing without persistence.", error);
}
