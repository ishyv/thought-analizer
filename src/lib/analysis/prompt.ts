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

/**
 * Extraction prompt builder.
 *
 * Constructs the system prompt and user message for the extraction API call.
 * All prompt copy lives here - nowhere else. To change what the model is
 * asked to do, change this file.
 *
 * The prompt is built from config.ts values so that taxonomy changes
 * automatically propagate into the prompt without manual string edits.
 */

const NODE_REF_FORMAT = '{ "kind": "phrase" | "statement", "id": string }';

function formatEnum(values: readonly string[]): string {
  return values.join(' | ');
}

function buildShapeExample(): string {
  return JSON.stringify(
    {
      input_text: '<original input>',
      extraction_quality: ALLOWED_EXTRACTION_QUALITY[0],
      phrase_groups: [
        {
          id: 'pg1',
          text: '<exact text span>',
          start: 0,
          end: 12,
          concept_label: 'short label',
          confidence: ALLOWED_CONFIDENCE_LEVELS[0],
          type: ALLOWED_PHRASE_TYPES[0],
          polarity: ALLOWED_POLARITIES[2]
        }
      ],
      statement_groups: [
        {
          id: 'sg1',
          text: '<exact clause span>',
          start: 0,
          end: 24,
          role: ALLOWED_STATEMENT_ROLES[0],
          phrase_ids: ['pg1']
        }
      ],
      relations: [
        {
          id: 'r1',
          source: { kind: 'statement', id: 'sg1' },
          target: { kind: 'phrase', id: 'pg1' },
          type: ALLOWED_RELATION_TYPES[0]
        }
      ],
      issues: [
        {
          id: 'i1',
          type: ALLOWED_ISSUE_TYPES[0],
          label: 'Short structural note.',
          related_ids: ['sg1', 'pg1'],
          confidence: ALLOWED_CONFIDENCE_LEVELS[1]
        }
      ],
      summary: 'One sentence describing the structure, not the morality or quality of the thought.'
    },
    null,
    2
  );
}

/** System prompt instructing the model on format, schema, and behavior. */
export function buildSystemPrompt(): string {
  return [
    'You analyze short written thoughts and return only a valid JSON object.',
    '',
    'Output rules:',
    '- Return only raw JSON. No markdown. No code fences. No explanation.',
    '- Match the ThoughtAnalysis schema exactly.',
    `- PhraseType values: ${formatEnum(ALLOWED_PHRASE_TYPES)}`,
    `- StatementRole values: ${formatEnum(ALLOWED_STATEMENT_ROLES)} — assign exactly one per statement:`,
    '  goal      — what the speaker wants, intends, or is trying to achieve. Always present-tense desire or intention.',
    '  condition — background context, established facts, or circumstances the speaker did not choose.',
    '  blocker   — something that prevents, opposes, or complicates the goal or action. Can be internal (fatigue, emotion) or external.',
    '  action    — something the speaker actively did, is doing, or is considering doing. Requires intentional agency. A passive result is NOT an action.',
    '  outcome   — what actually happened or resulted, especially when the speaker did not fully choose it, or when it restates an unresolved condition.',
    'CRITICAL DISTINCTION — action vs outcome:',
    '  If the speaker chose to do it with intent → action',
    '  If it happened as a result of other conditions → outcome',
    '  If it restates an unresolved need at the end → outcome',
    '  When in doubt, prefer outcome over action.',
    'Examples of action vs outcome misclassification to avoid:',
    '  WRONG: "I stayed there" → action  (no intent — result of exhaustion)',
    '  RIGHT: "I stayed there" → outcome (result of being too tired to move)',
    '  WRONG: "Nothing got built" → action',
    '  RIGHT: "Nothing got built" → outcome',
    `- RelationType values: ${formatEnum(ALLOWED_RELATION_TYPES)}`,
    `- IssueType values: ${formatEnum(ALLOWED_ISSUE_TYPES)}`,
    `- Polarity values: ${formatEnum(ALLOWED_POLARITIES)}`,
    `- ExtractionQuality values: ${formatEnum(ALLOWED_EXTRACTION_QUALITY)}`,
    `- Optional confidence values: ${formatEnum(ALLOWED_CONFIDENCE_LEVELS)}`,
    `- NodeRef format: ${NODE_REF_FORMAT}`,
    `- Limits: max ${MAX_PHRASE_GROUPS} phrase groups, max ${MAX_STATEMENT_GROUPS} statement groups, max ${MAX_RELATIONS} relations, max ${MAX_ISSUES} issues.`,
    '- Every phrase group must include concept_label as a 2-3 word lowercase noun phrase.',
    '- Use ids pg1/pg2... for phrases, sg1/sg2... for statements, r1/r2... for relations, i1/i2... for issues.',
    '- "start" and "end" are character offsets into input_text (0-indexed, end is exclusive). They must be exact. Count characters carefully — do not estimate. The span input_text.slice(start, end) must equal the "text" field exactly. Prefer starting and ending at word boundaries (spaces or string edges) — never split inside a word.',
    '- Before finalizing each phrase group, verify: input_text.slice(start, end) === text. If they do not match, adjust start and end until they do.',
    '- Summary must be one sentence, structural, and not evaluative.',
    '- Tone should be observant, not accusatory - frame issues as possible or apparent, not definitive.',
    '- Preserve the input text exactly in input_text.',
    '',
    'Return this JSON shape:',
    buildShapeExample()
  ].join('\n');
}

/** User message wrapping the input text. */
export function buildUserMessage(text: string): string {
  return `Analyze the following input and return only the JSON object.\n\n${text}`;
}
