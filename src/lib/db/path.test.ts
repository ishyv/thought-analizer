import { describe, expect, it } from 'vitest';
import { resolve } from 'node:path';

import { resolveDatabaseFilePath } from '$lib/db/path';

describe('resolveDatabaseFilePath', () => {
  it('defaults to the project db file outside Vercel', () => {
    expect(resolveDatabaseFilePath({}, '/workspace')).toBe(
      resolve('/workspace', 'db/thought-structure.db')
    );
  });

  it('uses the configured database path when provided', () => {
    expect(resolveDatabaseFilePath({ DATABASE_PATH: 'data/app.db' }, '/workspace')).toBe(
      resolve('/workspace', 'data/app.db')
    );
  });

  it('keeps special SQLite memory paths unchanged', () => {
    expect(resolveDatabaseFilePath({ DATABASE_PATH: ':memory:' }, '/workspace')).toBe(':memory:');
  });

  it('uses the writable tmp directory on Vercel by default', () => {
    expect(resolveDatabaseFilePath({ VERCEL: '1' }, '/workspace')).toBe('/tmp/thought-structure.db');
  });
});