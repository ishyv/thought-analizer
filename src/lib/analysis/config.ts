import type {
  ExtractionQuality,
  IssueType,
  PhraseType,
  Polarity,
  RelationType,
  StatementRole,
  StructuralReading,
  ReframeQuestion
} from '$lib/types';

/**
 * Analysis pipeline configuration.
 *
 * This file controls what the extraction model is asked to produce.
 * Changing values here changes behavior across the prompt, validator, and UI.
 *
 * V1 SCOPE NOTE:
 * The taxonomy in this file is intentionally reduced from the full spec.
 * Several heuristics were deferred for v1 to keep extraction reliable:
 *   - Concept nodes as first-class graph entities (currently phrase groups only)
 *   - Confidence scoring per phrase group (optional field, not required)
 *   - Dominant concept detection via LLM (currently derived heuristically)
 *   - Connector type annotation (e.g. "but", "so", "even though")
 *   - Argument mode / decision mode distinction
 *
 * To expand the taxonomy in a future iteration:
 *   1. Add the new values to the relevant enum in src/lib/types.ts
 *   2. Add the new values to the corresponding array in this file
 *   3. Update the prompt template in src/lib/analysis/prompt.ts
 *   4. Update the validator in src/lib/analysis/validate.ts
 *   5. Update the UI token system in src/app.css if new colors are needed
 *   6. Write at least one new hand-authored sample in src/lib/samples.ts
 *      that exercises the new behavior before relying on LLM output
 */

/** Maximum phrase groups the model should extract. */
export const MAX_PHRASE_GROUPS = 8;

/** Maximum statement groups the model should extract. */
export const MAX_STATEMENT_GROUPS = 8;

/** Maximum relations the model should extract. */
export const MAX_RELATIONS = 8;

/** Maximum issues the model should detect. */
export const MAX_ISSUES = 8;

/** Allowed values for PhraseType. Embedded in the extraction prompt. */
export const ALLOWED_PHRASE_TYPES: readonly PhraseType[] = [
  'need_desire',
  'state_context',
  'obstacle_blocker',
  'action_option',
  'outcome_result'
];

/** Allowed values for StatementRole. Embedded in the extraction prompt. */
export const ALLOWED_STATEMENT_ROLES: readonly StatementRole[] = [
  'goal',
  'condition',
  'blocker',
  'action',
  'outcome'
];

/** Allowed values for RelationType. Embedded in the extraction prompt. */
export const ALLOWED_RELATION_TYPES: readonly RelationType[] = [
  'supports',
  'blocks',
  'leads_to',
  'contrasts_with'
];

/** Allowed values for IssueType. Embedded in the extraction prompt. */
export const ALLOWED_ISSUE_TYPES: readonly IssueType[] = [
  'contradiction',
  'false_contrast',
  'missing_bridge',
  'unresolved_tension'
];

/** Allowed values for ExtractionQuality. */
export const ALLOWED_EXTRACTION_QUALITY: readonly ExtractionQuality[] = [
  'full',
  'partial',
  'minimal'
];

/** Allowed values for phrase polarity. Embedded in the extraction prompt. */
export const ALLOWED_POLARITIES: readonly Polarity[] = ['positive', 'negative', 'neutral'];

/** Allowed values for optional extraction confidence fields. */
export const ALLOWED_CONFIDENCE_LEVELS = ['high', 'medium', 'low'] as const;

/** Anthropic model used for extraction. */
export const EXTRACTION_MODEL = 'claude-haiku-4-5-20251001';

/** Max tokens for extraction response. */
export const EXTRACTION_MAX_TOKENS = 4096;

/** Number of retry attempts when the model returns an invalid or unparseable response. */
export const EXTRACTION_MAX_RETRIES = 2;

/** Max tokens for Pass 2 (structural reading). Smaller than Pass 1. */
export const READING_MAX_TOKENS = 600;

/** Max tokens for Pass 3 (reframe question). Very small. */
export const REFRAME_MAX_TOKENS = 200;

/**
 * Fallback StructuralReading returned when Pass 2 fails validation.
 * Minimal but structurally valid.
 */
export const READING_FALLBACK: StructuralReading = {
  deepTension: 'The structure of this thought could not be fully read.',
  hiddenAssumption: '',
  pattern: 'unclear',
  subtext: ''
};

/**
 * Fallback ReframeQuestion returned when Pass 3 fails validation.
 */
export const REFRAME_FALLBACK: ReframeQuestion = {
  question: 'What would change if one of these constraints turned out to be optional?',
  rationale: 'A general opening question when the specific structure is unclear.'
};

