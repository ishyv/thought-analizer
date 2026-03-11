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

/**
 * Output of Pass 2: deep structural reasoning about the analysis.
 * Produced by reasoning about Pass 1 output, not the raw text.
 */
export interface StructuralReading {
  /**
   * The deepest tension — the underlying conflict beneath the surface
   * one. 1–2 sentences. Not a restatement of the issue labels.
   */
  deepTension: string;

  /**
   * The unstated assumption holding the thought together. The belief
   * that, if examined, might dissolve or reframe the tension.
   * 1–2 sentences.
   */
  hiddenAssumption: string;

  /**
   * The pattern this thought belongs to. A named archetype drawn from
   * the structural shape of the analysis — not from pop psychology.
   * Should feel observational, not diagnostic.
   *
   * Examples:
   *   "approach-avoidance conflict"
   *   "paralysis by competing values"
   *   "need with no available agency"
   *   "goal without belief in reachability"
   *   "self-undermining constraint"
   */
  pattern: string;

  /**
   * What the person may not be saying but might need to.
   * The subtext or unvoiced element the structure implies.
   * 1 sentence. Framed as an observation, not an accusation.
   */
  subtext: string;
}

/**
 * Output of Pass 3: a single reframe question.
 * Generated from the StructuralReading, not the raw text.
 * The question should shift the person's relationship to the thought
 * if sat with honestly — not solve it, not advise, just reorient.
 */
export interface ReframeQuestion {
  /** The question itself. One sentence. Ends with a question mark. */
  question: string;

  /**
   * A brief note on why this question — what in the structure it
   * targets. 1 sentence. Shown as secondary text below the question.
   * Framed as interpretation, not explanation.
   */
  rationale: string;
}

/**
 * The full three-pass analysis result.
 * Extends the existing ThoughtAnalysis with the two new pass outputs.
 */
export interface FullAnalysis {
  /** Pass 1 output — structural extraction. */
  extraction: ThoughtAnalysis;

  /**
   * Pass 2 output — deep structural reading.
   * Null until Pass 2 completes.
   */
  reading: StructuralReading | null;

  /**
   * Pass 3 output — reframe question.
   * Null until Pass 3 completes.
   */
  reframe: ReframeQuestion | null;
}

/**
 * Progress state for the multi-pass pipeline.
 * Drives the processing view and progressive reveal.
 */
export type PipelinePhase =
  | 'extracting'   // Pass 1 in flight
  | 'reading'      // Pass 1 done, Pass 2 in flight
  | 'reframing'    // Pass 2 done, Pass 3 in flight
  | 'complete';    // All passes done
