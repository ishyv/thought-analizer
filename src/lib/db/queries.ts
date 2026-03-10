/**
 * Database query functions for the analyses table.
 *
 * All functions are synchronous (better-sqlite3 is sync).
 * All functions are pure — they take and return typed values,
 * no side effects beyond the DB write/read.
 */

import { desc, eq } from "drizzle-orm";

import type { ThoughtAnalysis } from "$lib/types";

import { getDb } from "./client";
import { analyses, type AnalysisRow } from "./schema";

function requireDb() {
  const db = getDb();

  if (!db) {
    throw new Error("SQLite is unavailable in the current runtime.");
  }

  return db;
}

/**
 * Persists a completed analysis to the database.
 * Generates a UUID for the record and returns it.
 *
 * @param inputText - The raw thought text submitted by the user
 * @param analysis  - The validated ThoughtAnalysis object
 * @returns The generated UUID for the new record
 */
export function saveAnalysis(inputText: string, analysis: ThoughtAnalysis): string {
  const id = crypto.randomUUID();
  const db = requireDb();

  db.insert(analyses)
    .values({
      id,
      inputText,
      analysisJson: JSON.stringify(analysis),
      extractionQuality: analysis.extraction_quality,
      createdAt: Date.now(),
    })
    .run();

  return id;
}

/**
 * Returns all analyses ordered by most recent first.
 * Does not deserialize analysisJson — returns raw rows.
 * Use `getAnalysisById` to get the full deserialized analysis.
 */
export function listAnalyses(): AnalysisRow[] {
  const db = getDb();

  if (!db) {
    return [];
  }

  return db.select().from(analyses).orderBy(desc(analyses.createdAt)).all();
}

/**
 * Returns a single analysis row by id, or null if not found.
 */
export function getAnalysisById(id: string): AnalysisRow | null {
  const db = getDb();

  if (!db) {
    return null;
  }

  const row = db.select().from(analyses).where(eq(analyses.id, id)).get();
  return row ?? null;
}

/**
 * Deletes an analysis record by id.
 * Returns true if a record was deleted, false if not found.
 */
export function deleteAnalysis(id: string): boolean {
  const db = getDb();

  if (!db) {
    return false;
  }

  const result = db.delete(analyses).where(eq(analyses.id, id)).run();
  return result.changes > 0;
}
