import { mkdirSync } from 'node:fs';
import { dirname, isAbsolute, resolve } from 'node:path';

const DEFAULT_DB_PATH = 'db/thought-structure.db';
const VERCEL_DB_PATH = '/tmp/thought-structure.db';
const IN_MEMORY_DB_PATH = ':memory:';

/**
 * Resolves the SQLite file path for the current runtime.
 *
 * Local development keeps the existing project-level database file.
 * Vercel defaults to `/tmp`, which is the writable filesystem location
 * available in Node serverless functions.
 */
export function resolveDatabaseFilePath(
  env: NodeJS.ProcessEnv = process.env,
  cwd = process.cwd()
): string {
  const configuredPath = env.DATABASE_PATH?.trim();

  if (configuredPath) {
    if (configuredPath === IN_MEMORY_DB_PATH || isAbsolute(configuredPath)) {
      return configuredPath;
    }

    return resolve(cwd, configuredPath);
  }

  if (env.VERCEL) {
    return VERCEL_DB_PATH;
  }

  return resolve(cwd, DEFAULT_DB_PATH);
}

/** Ensures the parent directory for the SQLite file exists. */
export function ensureDatabasePath(filePath = resolveDatabaseFilePath()): string {
  if (filePath !== IN_MEMORY_DB_PATH) {
    mkdirSync(dirname(filePath), { recursive: true });
  }

  return filePath;
}