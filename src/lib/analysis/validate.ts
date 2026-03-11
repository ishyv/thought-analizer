import { z } from 'zod';

import {
  ALLOWED_CONFIDENCE_LEVELS,
  ALLOWED_EXTRACTION_QUALITY,
  ALLOWED_ISSUE_TYPES,
  ALLOWED_PHRASE_TYPES,
  ALLOWED_POLARITIES,
  ALLOWED_RELATION_TYPES,
  ALLOWED_STATEMENT_ROLES,
  MAX_ISSUES,
  MAX_PHRASE_GROUPS,
  MAX_RELATIONS,
  MAX_STATEMENT_GROUPS
} from '$lib/analysis/config';
import type { ReframeQuestion, StructuralReading, ThoughtAnalysis } from '$lib/types';

/**
 * Response validator for LLM extraction output.
 *
 * Uses Zod for schema validation. Validation is intentionally lenient on
 * optional fields and strict on structural shape. A response with missing
 * optional fields is valid. A response with wrong enum values or missing
 * required fields is not.
 *
 * All enum checks pull from config.ts — never hardcoded here.
 */

// Zod v4 z.enum() requires a mutable array — spread readonly config arrays to satisfy this.
const phraseTypeEnum = z.enum([...ALLOWED_PHRASE_TYPES]);
const statementRoleEnum = z.enum([...ALLOWED_STATEMENT_ROLES]);
const relationTypeEnum = z.enum([...ALLOWED_RELATION_TYPES]);
const issueTypeEnum = z.enum([...ALLOWED_ISSUE_TYPES]);
const extractionQualityEnum = z.enum([...ALLOWED_EXTRACTION_QUALITY]);
const confidenceEnum = z.enum([...ALLOWED_CONFIDENCE_LEVELS]);

const PhraseGroupSchema = z.object({
  id: z.string().regex(/^pg\d+$/),
  text: z.string().min(1),
  start: z.number().int(),
  end: z.number().int(),
  concept_label: z.string().min(1),
  confidence: confidenceEnum.optional(),
  type: phraseTypeEnum,
  polarity: z.enum([...ALLOWED_POLARITIES])
});

const StatementGroupSchema = z.object({
  id: z.string().regex(/^sg\d+$/),
  text: z.string().min(1),
  start: z.number().int(),
  end: z.number().int(),
  role: statementRoleEnum,
  phrase_ids: z.array(z.string())
});

const NodeRefSchema = z.object({
  kind: z.enum(['phrase', 'statement']),
  id: z.string()
});

const RelationSchema = z.object({
  id: z.string().regex(/^r\d+$/),
  source: NodeRefSchema,
  target: NodeRefSchema,
  type: relationTypeEnum
});

const IssueSchema = z.object({
  id: z.string().regex(/^i\d+$/),
  type: issueTypeEnum,
  label: z.string().min(1),
  related_ids: z.array(z.string()),
  confidence: confidenceEnum.optional()
});

const ThoughtAnalysisSchema = z.object({
  input_text: z.string(),
  extraction_quality: extractionQualityEnum,
  phrase_groups: z.array(PhraseGroupSchema).max(MAX_PHRASE_GROUPS),
  statement_groups: z.array(StatementGroupSchema).max(MAX_STATEMENT_GROUPS),
  relations: z.array(RelationSchema).max(MAX_RELATIONS),
  issues: z.array(IssueSchema).max(MAX_ISSUES),
  summary: z.string().min(1)
});

/**
 * Corrects phrase group char offsets that are slightly misaligned by the LLM.
 * Returns true if all offsets are perfectly aligned (or successfully corrected).
 * Logs a warning for any group where input_text does not closely match
 * the group's text field even after a fuzzy search window.
 */
function snapPhraseOffsets(analysis: ThoughtAnalysis): void {
  const WINDOW = 20;
  
  for (const pg of analysis.phrase_groups) {
    const sliced = analysis.input_text.slice(pg.start, pg.end);
    const normalSlice = sliced.trim().toLowerCase();
    const normalText = pg.text.trim().toLowerCase();

    if (normalSlice !== normalText) {
      // Offset is wrong. Search for the text near the given coordinates.
      const searchStart = Math.max(0, pg.start - WINDOW);
      const searchEnd = Math.min(analysis.input_text.length, pg.end + WINDOW);
      const windowContext = analysis.input_text.slice(searchStart, searchEnd);
      
      const localIndex = windowContext.toLowerCase().indexOf(normalText);
      
      if (localIndex !== -1) {
        // Found it! Correct the offsets stringently.
        // We know where it starts in the window. We need to map that back to the global string.
        const absoluteMatchStart = searchStart + localIndex;
        // The original text might have different casing or spacing at the ends,
        // so we find the exact substring length in the original context.
        // Since we only matched the trimmed lowercase version, we'll assign the bounds
        // to map exactly to the length of normalText (ignoring trailing spaces from the LLM).
        pg.start = absoluteMatchStart;
        pg.end = absoluteMatchStart + normalText.length;
      } else {
        // Only warn if we truly couldn't find it within the window.
        console.warn(
          `[validate] Unrecoverable offset mismatch on ${pg.id}:\n  expected: "${pg.text}"\n  got:      "${sliced}"`
        );
      }
    }
  }
}

/**
 * Validates a raw unknown value as a ThoughtAnalysis.
 * Returns the typed value on success, null on failure.
 * Logs a structured warning on failure (never throws).
 * Runs a diagnostic offset audit after successful validation.
 *
 * @param raw Raw unknown API output.
 * @returns A validated ThoughtAnalysis or null when validation fails.
 */
export function validateAnalysis(raw: unknown): ThoughtAnalysis | null {
  const result = ThoughtAnalysisSchema.safeParse(raw);

  if (!result.success) {
    console.warn('[validate] Analysis validation failed:', result.error.flatten());
    return null;
  }

  const analysis = result.data as ThoughtAnalysis;
  snapPhraseOffsets(analysis);
  return analysis;
}

// ── Reading & reframe field limits ─────────────────────────

const READING_MAX_CHARS = 500;
const REFRAME_MAX_CHARS = 300;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Validates raw Pass 2 output as a StructuralReading.
 * Returns null on failure. Logs a warning with the reason.
 */
export function validateReading(raw: unknown): StructuralReading | null {
  if (!isRecord(raw)) {
    console.warn('[validate] Reading validation failed: not an object');
    return null;
  }

  const { deepTension, hiddenAssumption, pattern, subtext } = raw;

  if (!isNonEmptyString(deepTension)) {
    console.warn('[validate] Reading validation failed: deepTension missing or empty');
    return null;
  }

  if (!isNonEmptyString(hiddenAssumption)) {
    console.warn('[validate] Reading validation failed: hiddenAssumption missing or empty');
    return null;
  }

  if (!isNonEmptyString(pattern)) {
    console.warn('[validate] Reading validation failed: pattern missing or empty');
    return null;
  }

  if (!isNonEmptyString(subtext)) {
    console.warn('[validate] Reading validation failed: subtext missing or empty');
    return null;
  }

  const fields = [
    ['deepTension', deepTension],
    ['hiddenAssumption', hiddenAssumption],
    ['pattern', pattern],
    ['subtext', subtext]
  ] as const;

  for (const [name, value] of fields) {
    if (value.length > READING_MAX_CHARS) {
      console.warn(`[validate] Reading validation failed: ${name} exceeds ${READING_MAX_CHARS} chars`);
      return null;
    }
  }

  return { deepTension, hiddenAssumption, pattern, subtext };
}

/**
 * Validates raw Pass 3 output as a ReframeQuestion.
 * Returns null on failure. Logs a warning with the reason.
 */
export function validateReframe(raw: unknown): ReframeQuestion | null {
  if (!isRecord(raw)) {
    console.warn('[validate] Reframe validation failed: not an object');
    return null;
  }

  const { question, rationale } = raw;

  if (!isNonEmptyString(question)) {
    console.warn('[validate] Reframe validation failed: question missing or empty');
    return null;
  }

  if (!isNonEmptyString(rationale)) {
    console.warn('[validate] Reframe validation failed: rationale missing or empty');
    return null;
  }

  if (!question.trimEnd().endsWith('?')) {
    console.warn('[validate] Reframe validation failed: question must end with "?"');
    return null;
  }

  if (question.length > REFRAME_MAX_CHARS) {
    console.warn(`[validate] Reframe validation failed: question exceeds ${REFRAME_MAX_CHARS} chars`);
    return null;
  }

  if (rationale.length > REFRAME_MAX_CHARS) {
    console.warn(`[validate] Reframe validation failed: rationale exceeds ${REFRAME_MAX_CHARS} chars`);
    return null;
  }

  return { question, rationale };
}

