/**
 * Database schema for Thought Structure.
 *
 * Single table: `analyses`
 * Stores every submitted thought and its full analysis result.
 * Used by the admin dashboard to browse and replay past analyses.
 */

import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

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
