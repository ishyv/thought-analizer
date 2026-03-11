/**
 * Database query functions for the analyses table.
 *
 * All functions are synchronous (better-sqlite3 is sync).
 * All functions are pure — they take and return typed values,
 * no side effects beyond the DB write/read.
 */

import { and, asc, desc, eq, gte, lt } from 'drizzle-orm';

import type { FullAnalysis, ReframeQuestion, StructuralReading, ThoughtAnalysis } from '$lib/types';

import { getDb } from './client';
import { analyses, rateLimitEvents, type AnalysisRow, type RateLimitEventInsert } from './schema';

function requireDb() {
  const db = getDb();

  if (!db) {
    throw new Error('SQLite is unavailable in the current runtime.');
  }

  return db;
}

/**
 * Normalizes text for cache lookups.
 * Lowercase, trim, collapse multiple whitespace to single spaces.
 */
export function normalizeText(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Persists a completed analysis to the database.
 * Generates a UUID for the record and returns it.
 *
 * Accepts either a FullAnalysis (three-pass result) or a legacy
 * ThoughtAnalysis (for backward compatibility with existing callers).
 *
 * @param inputText     - The raw thought text submitted by the user
 * @param analysisOrFull - The validated analysis object
 * @returns The generated UUID for the new record
 */
export function saveAnalysis(
  inputText: string,
  analysisOrFull: FullAnalysis | ThoughtAnalysis
): string {
  const id = crypto.randomUUID();
  const db = requireDb();
  const normalizedText = normalizeText(inputText);

  // Detect FullAnalysis by checking for the `extraction` field
  const isFullAnalysis = 'extraction' in analysisOrFull;
  const quality = isFullAnalysis
    ? analysisOrFull.extraction.extraction_quality
    : analysisOrFull.extraction_quality;

  // Extract reading and reframe if available
  const readingJson =
    isFullAnalysis && analysisOrFull.reading ? JSON.stringify(analysisOrFull.reading) : null;
  const reframeJson =
    isFullAnalysis && analysisOrFull.reframe ? JSON.stringify(analysisOrFull.reframe) : null;

  db.insert(analyses)
    .values({
      id,
      inputText,
      normalizedText,
      analysisJson: JSON.stringify(analysisOrFull),
      readingJson,
      reframeJson,
      extractionQuality: quality,
      createdAt: Date.now()
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

export interface AcceptedRateLimitEventRow {
  cost: number;
  createdAt: number;
}

export function recordRateLimitEvent(event: Omit<RateLimitEventInsert, 'id'>): string {
  const id = crypto.randomUUID();
  const db = requireDb();

  db.insert(rateLimitEvents)
    .values({
      id,
      ...event
    })
    .run();

  return id;
}

export function listAcceptedRateLimitEvents(
  userKey: string,
  routeKey: string,
  createdAtGte: number
): AcceptedRateLimitEventRow[] {
  const db = requireDb();

  return db
    .select({
      cost: rateLimitEvents.cost,
      createdAt: rateLimitEvents.createdAt
    })
    .from(rateLimitEvents)
    .where(
      and(
        eq(rateLimitEvents.userKey, userKey),
        eq(rateLimitEvents.routeKey, routeKey),
        eq(rateLimitEvents.decision, 'accepted'),
        gte(rateLimitEvents.createdAt, createdAtGte)
      )
    )
    .orderBy(asc(rateLimitEvents.createdAt))
    .all();
}

export function pruneRateLimitEvents(createdBefore: number): number {
  const db = getDb();

  if (!db) {
    return 0;
  }

  const result = db
    .delete(rateLimitEvents)
    .where(lt(rateLimitEvents.createdAt, createdBefore))
    .run();
  return result.changes;
}

/**
 * Finds a cached analysis by normalized text.
 * Returns the full 3-pass analysis if found, null otherwise.
 */
export function findCachedAnalysis(normalizedText: string): FullAnalysis | null {
  const db = getDb();

  if (!db) {
    return null;
  }

  const row = db
    .select()
    .from(analyses)
    .where(eq(analyses.normalizedText, normalizedText))
    .orderBy(desc(analyses.createdAt))
    .get();

  if (!row) {
    return null;
  }

  try {
    const extraction: ThoughtAnalysis = JSON.parse(row.analysisJson);
    const reading: StructuralReading | null = row.readingJson ? JSON.parse(row.readingJson) : null;
    const reframe: ReframeQuestion | null = row.reframeJson ? JSON.parse(row.reframeJson) : null;

    return {
      extraction,
      reading,
      reframe
    };
  } catch {
    return null;
  }
}

/**
 * Updates the reading (Pass 2) result for an existing analysis.
 * Finds by normalized text and updates the reading_json column.
 */
export function updateReading(normalizedText: string, reading: StructuralReading): boolean {
  const db = requireDb();

  const result = db
    .update(analyses)
    .set({ readingJson: JSON.stringify(reading) })
    .where(eq(analyses.normalizedText, normalizedText))
    .run();

  return result.changes > 0;
}

/**
 * Updates the reframe (Pass 3) result for an existing analysis.
 * Finds by normalized text and updates the reframe_json column.
 */
export function updateReframe(normalizedText: string, reframe: ReframeQuestion): boolean {
  const db = requireDb();

  const result = db
    .update(analyses)
    .set({ reframeJson: JSON.stringify(reframe) })
    .where(eq(analyses.normalizedText, normalizedText))
    .run();

  return result.changes > 0;
}
