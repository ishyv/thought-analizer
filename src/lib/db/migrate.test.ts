import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';

import { afterEach, describe, expect, it } from 'vitest';

import { initDb } from '$lib/db/migrate';

const require = createRequire(import.meta.url);
const Database = require('better-sqlite3') as typeof import('better-sqlite3');

const tempDirs: string[] = [];

function createTempDbPath(): string {
  const dir = mkdtempSync(join(tmpdir(), 'thought-structure-db-'));
  tempDirs.push(dir);
  return join(dir, 'test.db');
}

afterEach(() => {
  delete process.env.DATABASE_PATH;

  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe('initDb', () => {
  it('upgrades legacy analyses tables to the current schema', () => {
    const databasePath = createTempDbPath();
    const sqlite = new Database(databasePath);

    sqlite.exec(`
      CREATE TABLE analyses (
        id                 TEXT    PRIMARY KEY,
        input_text         TEXT    NOT NULL,
        analysis_json      TEXT    NOT NULL,
        extraction_quality TEXT    NOT NULL,
        created_at         INTEGER NOT NULL
      );
    `);

    sqlite
      .prepare(
        `INSERT INTO analyses (id, input_text, analysis_json, extraction_quality, created_at)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(
        'legacy-row',
        '  Mixed   CASE   thought  ',
        '{"summary":"legacy"}',
        'full',
        123
      );

    sqlite.close();

    process.env.DATABASE_PATH = databasePath;
    initDb();

    const migrated = new Database(databasePath);
    const columns = migrated
      .prepare(`PRAGMA table_info(analyses)`)
      .all() as Array<{ name: string; notnull: number }>;

    expect(columns.map((column) => column.name)).toEqual([
      'id',
      'input_text',
      'analysis_json',
      'extraction_quality',
      'created_at',
      'normalized_text',
      'reading_json',
      'reframe_json'
    ]);

    const normalizedColumn = columns.find((column) => column.name === 'normalized_text');
    expect(normalizedColumn?.notnull).toBe(1);

    const row = migrated
      .prepare(`SELECT normalized_text, reading_json, reframe_json FROM analyses WHERE id = ?`)
      .get('legacy-row') as {
      normalized_text: string;
      reading_json: string | null;
      reframe_json: string | null;
    };

    expect(row).toEqual({
      normalized_text: 'mixed case thought',
      reading_json: null,
      reframe_json: null
    });

    const indexRows = migrated
      .prepare(`PRAGMA index_list(analyses)`)
      .all() as Array<{ name: string }>;

    expect(indexRows.some((row) => row.name === 'analyses_normalized_text_idx')).toBe(true);
    migrated.close();
  });
});
