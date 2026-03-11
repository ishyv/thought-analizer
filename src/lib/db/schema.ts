/**
 * Database schema for Thought Structure.
 *
 * Single table: `analyses`
 * Stores every submitted thought and its full analysis result.
 * Used by the admin dashboard to browse and replay past analyses.
 */

import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const analyses = sqliteTable(
  'analyses',
  {
    /** UUID primary key generated at insert time. */
    id: text('id').primaryKey(),

    /** The raw input text submitted by the user. */
    inputText: text('input_text').notNull(),

    /**
     * Normalized version of inputText for cache lookups.
     * Lowercase, trimmed, with collapsed whitespace.
     */
    normalizedText: text('normalized_text').notNull(),

    /**
     * The full ThoughtAnalysis object serialized as JSON.
     * Deserialize with JSON.parse and validate against ThoughtAnalysis
     * before use — do not trust raw DB output.
     */
    analysisJson: text('analysis_json').notNull(),

    /**
     * Pass 2: Deep structural reading serialized as JSON.
     * Null if Pass 2 has not been run or cached yet.
     */
    readingJson: text('reading_json'),

    /**
     * Pass 3: Reframe question serialized as JSON.
     * Null if Pass 3 has not been run or cached yet.
     */
    reframeJson: text('reframe_json'),

    /**
     * Denormalized extraction quality for fast filtering without
     * deserializing the full JSON blob.
     */
    extractionQuality: text('extraction_quality').notNull(),

    /**
     * Unix timestamp (milliseconds) of when the analysis was stored.
     * Use Date.now() at insert time.
     */
    createdAt: integer('created_at').notNull()
  },
  (table) => ({
    normalizedTextIdx: index('analyses_normalized_text_idx').on(table.normalizedText)
  })
);

/** Inferred insert type for the analyses table. */
export type AnalysisInsert = typeof analyses.$inferInsert;

/** Inferred select type for the analyses table. */
export type AnalysisRow = typeof analyses.$inferSelect;

export const rateLimitEvents = sqliteTable(
  'rate_limit_events',
  {
    id: text('id').primaryKey(),
    userKey: text('user_key').notNull(),
    routeKey: text('route_key').notNull(),
    decision: text('decision').notNull(),
    cost: integer('cost').notNull(),
    inputChars: integer('input_chars').notNull(),
    createdAt: integer('created_at').notNull()
  },
  (table) => ({
    userRouteCreatedAtIdx: index('rate_limit_events_user_route_created_at_idx').on(
      table.userKey,
      table.routeKey,
      table.createdAt
    )
  })
);

export type RateLimitEventInsert = typeof rateLimitEvents.$inferInsert;
export type RateLimitEventRow = typeof rateLimitEvents.$inferSelect;
