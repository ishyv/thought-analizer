/**
 * Thought-analysis domain model.
 *
 * Central source of truth for the analysis payload returned by extraction,
 * stored in SQLite, and rendered by the UI.
 *
 * Invariants:
 * - Ids are stable within a single analysis payload and follow pg/sg/r/i prefixes.
 * - `start`/`end` offsets are character offsets into `input_text`.
 * - The fallback object always represents a safe minimal payload for degraded UX.
 *
 * Limits:
 * - This module defines the domain contract only.
 * - It does not validate raw input or call external services.
 */

/** Phrase-level extraction categories used in v1 analysis output. */
export type PhraseType =
  | 'need_desire'
  | 'state_context'
  | 'obstacle_blocker'
  | 'action_option'
  | 'outcome_result';

/** Statement-level roles used to organize extracted clauses. */
export type StatementRole = 'goal' | 'condition' | 'blocker' | 'action' | 'outcome';

/** Relationship categories connecting phrases or statements. */
export type RelationType = 'supports' | 'blocks' | 'leads_to' | 'contrasts_with';

/** Structural issue categories highlighted in the insight rail. */
export type IssueType =
  | 'contradiction'
  | 'false_contrast'
  | 'missing_bridge'
  | 'unresolved_tension';

/** Sentiment direction for extracted phrase groups. */
export type Polarity = 'positive' | 'negative' | 'neutral';

/** Overall extraction completeness used to drive graceful UI degradation. */
export type ExtractionQuality = 'full' | 'partial' | 'minimal';

/** Typed reference to either a phrase node or a statement node. */
export type NodeRef = { kind: 'phrase'; id: string } | { kind: 'statement'; id: string };

/** Phrase-level extraction unit anchored to a source-text span. */
export interface PhraseGroup {
  id: string;
  text: string;
  start: number;
  end: number;
  concept_label: string;
  confidence?: 'high' | 'medium' | 'low';
  type: PhraseType;
  polarity: Polarity;
}

/** Statement-level grouping that maps clauses to contained phrase ids. */
export interface StatementGroup {
  id: string;
  text: string;
  start: number;
  end: number;
  role: StatementRole;
  phrase_ids: string[];
}

/** Directed relation connecting two phrase or statement references. */
export interface Relation {
  id: string;
  source: NodeRef;
  target: NodeRef;
  type: RelationType;
}

/** Higher-order structural issue surfaced in the insight rail. */
export interface Issue {
  id: string;
  type: IssueType;
  label: string;
  related_ids: string[];
  confidence?: 'high' | 'medium' | 'low';
}

/** Fully validated analysis payload returned to the UI. */
export interface ThoughtAnalysis {
  input_text: string;
  extraction_quality: ExtractionQuality;
  phrase_groups: PhraseGroup[];
  statement_groups: StatementGroup[];
  relations: Relation[];
  issues: Issue[];
  summary: string;
}

/** Shared fallback summary used when extraction fails or validates poorly. */
export const EXTRACTION_FALLBACK_SUMMARY =
  'The input could not be analyzed. Try a longer thought with more detail.';

/** Shared minimal analysis baseline reused by both client and server fallbacks. */
export const EXTRACTION_FALLBACK: ThoughtAnalysis = {
  input_text: '',
  extraction_quality: 'minimal',
  phrase_groups: [],
  statement_groups: [],
  relations: [],
  issues: [],
  summary: EXTRACTION_FALLBACK_SUMMARY
};
