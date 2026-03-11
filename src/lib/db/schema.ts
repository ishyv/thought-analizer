/**
 * Database schema for Thought Structure.
 *
 * Single table: `analyses`
 * Stores every submitted thought and its full analysis result.
 * Used by the admin dashboard to browse and replay past analyses.
 */

import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const analyses = sqliteTable("analyses", {
  /** UUID primary key generated at insert time. */
  id: text("id").primaryKey(),

  /** The raw input text submitted by the user. */
  inputText: text("input_text").notNull(),

  /**
   * The full ThoughtAnalysis object serialized as JSON.
   * Deserialize with JSON.parse and validate against ThoughtAnalysis
   * before use — do not trust raw DB output.
   */
  analysisJson: text("analysis_json").notNull(),

  /**
   * Denormalized extraction quality for fast filtering without
   * deserializing the full JSON blob.
   */
  extractionQuality: text("extraction_quality").notNull(),

  /**
   * Unix timestamp (milliseconds) of when the analysis was stored.
   * Use Date.now() at insert time.
   */
  createdAt: integer("created_at").notNull(),
});

/** Inferred insert type for the analyses table. */
export type AnalysisInsert = typeof analyses.$inferInsert;

/** Inferred select type for the analyses table. */
export type AnalysisRow = typeof analyses.$inferSelect;

export const rateLimitEvents = sqliteTable(
  "rate_limit_events",
  {
    id: text("id").primaryKey(),
    userKey: text("user_key").notNull(),
    routeKey: text("route_key").notNull(),
    decision: text("decision").notNull(),
    cost: integer("cost").notNull(),
    inputChars: integer("input_chars").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (table) => ({
    userRouteCreatedAtIdx: index("rate_limit_events_user_route_created_at_idx").on(
      table.userKey,
      table.routeKey,
      table.createdAt,
    ),
  }),
);

export type RateLimitEventInsert = typeof rateLimitEvents.$inferInsert;
export type RateLimitEventRow = typeof rateLimitEvents.$inferSelect;
