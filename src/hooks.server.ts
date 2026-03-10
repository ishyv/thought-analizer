/**
 * SvelteKit server hooks.
 * Runs once on server startup.
 */

import { initDb } from "$lib/db/migrate";

initDb();
