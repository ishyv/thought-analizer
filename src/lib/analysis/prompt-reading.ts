import type { ThoughtAnalysis } from '$lib/types';

/**
 * Pass 2 prompt builder: deep structural reasoning.
 *
 * The model receives Pass 1 output as structured data and reasons
 * about it — not about the raw text. This produces interpretation
 * rather than labeling.
 */

/**
 * Builds the system prompt for Pass 2: deep structural reasoning.
 *
 * The model receives Pass 1 output as structured data and reasons
 * about it — not about the raw text. This produces interpretation
 * rather than labeling.
 */
export function buildReadingSystemPrompt(): string {
  return [
    'You are analyzing the structure of a short written thought.',
    '',
    'You have been given the original text and a structural extraction of it —',
    'phrase groups, statement roles, relationships, and detected issues.',
    '',
    'Your task is to reason about what the structure reveals, not to',
    're-describe what is already labeled. Look at the shape of the reasoning:',
    'the pattern of blockers, the relationship between the goal and the',
    'obstacles, what is present and what is conspicuously absent.',
    '',
    'Return a single JSON object with exactly these four fields:',
    '',
    '{',
    '  "deepTension": string,',
    '  "hiddenAssumption": string,',
    '  "pattern": string,',
    '  "subtext": string',
    '}',
    '',
    'Field requirements:',
    '',
    'deepTension:',
    '  The tension underneath the surface conflict — the real opposition that',
    '  makes this thought feel stuck. Not a restatement of the issue labels.',
    '  Look at what the person wants vs what they believe is available to them.',
    '  1–2 sentences. Observational, not evaluative.',
    '',
    'hiddenAssumption:',
    '  The unstated belief holding the thought together. If this assumption',
    '  were false or examined, the structure of the thought would change.',
    '  Find it by asking: what must the person believe for this conflict to',
    '  feel unresolvable?',
    '  1–2 sentences.',
    '',
    'pattern:',
    '  A short name for the structural archetype this thought represents.',
    '  Draw it from the shape of the analysis, not from the content.',
    '  Lowercase, 2–5 words. Avoid clinical or pop-psychology terms.',
    '  Examples: "approach-avoidance conflict", "need with no available',
    '  agency", "paralysis by competing values", "goal without belief in',
    '  reachability", "self-undermining constraint", "unanchored desire".',
    '',
    'subtext:',
    '  What the person may not be saying but what the structure implies they',
    '  might need to. The unvoiced element. Frame as an observation:',
    '  "There may be..." or "The structure suggests..." — not as accusation.',
    '  1 sentence.',
    '',
    'Tone: observant, precise, slightly interpretive. Not therapeutic.',
    'Not prescriptive. You are describing what you see in the structure,',
    'not telling the person what to do or feel.',
    '',
    'Return only valid JSON. No preamble. No markdown. No explanation.'
  ].join('\n');
}

/**
 * Builds the user message for Pass 2.
 * Contains the original text and the full Pass 1 extraction as JSON.
 *
 * @param originalText  - The original thought submitted by the user
 * @param extraction    - The validated Pass 1 ThoughtAnalysis
 */
export function buildReadingUserMessage(
  originalText: string,
  extraction: ThoughtAnalysis
): string {
  const extractionJson = JSON.stringify(extraction, null, 2);

  return [
    'Original text:',
    `"${originalText}"`,
    '',
    'Structural extraction:',
    extractionJson,
    '',
    'Reason about the structure above and return your reading as JSON.'
  ].join('\n');
}
