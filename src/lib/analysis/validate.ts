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
import type { ThoughtAnalysis } from '$lib/types';

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
 * Validates a raw unknown value as a ThoughtAnalysis.
 * Returns the typed value on success, null on failure.
 * Logs a structured warning on failure (never throws).
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

  return result.data as ThoughtAnalysis;
}
