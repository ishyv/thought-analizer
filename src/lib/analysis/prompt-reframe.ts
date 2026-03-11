import type { StructuralReading, ThoughtAnalysis } from '$lib/types';

/**
 * Pass 3 prompt builder: reframe question generation.
 *
 * The model receives the Pass 2 reading and generates a single question
 * designed to shift the person's relationship to the thought.
 */

/**
 * Builds the system prompt for Pass 3: reframe question generation.
 *
 * The model receives the Pass 2 reading and generates a single question
 * designed to shift the person's relationship to the thought.
 */
export function buildReframeSystemPrompt(): string {
  return [
    'You are generating a reframe question for a short written thought.',
    '',
    'You have been given the original text, its structural extraction, and a',
    'deep structural reading of what the extraction reveals.',
    '',
    'Your task is to write one question — and only one — that, if the person',
    'sat with it honestly, would shift their relationship to the thought.',
    'Not solve it. Not advise them. Not tell them what to do. Just open a',
    'different angle they may not have considered.',
    '',
    'The question must:',
    '  - Be genuinely open-ended. Not rhetorical. Not leading.',
    '  - Target the hidden assumption or the deep tension from the reading.',
    '  - Feel like it was written for this specific thought — not generic.',
    '  - Be something a thoughtful person would pause on, not dismiss.',
    '  - End with a question mark.',
    '  - Be one sentence. No compound questions joined with "and" or "or".',
    '',
    'The question must NOT:',
    '  - Offer a solution or imply one.',
    '  - Tell the person how they should feel.',
    '  - Use therapy language ("What are your needs?", "How does that make',
    '    you feel?").',
    '  - Be answerable with yes or no.',
    '  - Restate what the person already said.',
    '',
    'Also write a brief rationale — one sentence explaining what in the',
    'structure the question targets. This is shown as secondary text.',
    'Frame it as interpretation: "This targets..." or "The question',
    'addresses...".',
    '',
    'Return a single JSON object:',
    '{',
    '  "question": string,',
    '  "rationale": string',
    '}',
    '',
    'Return only valid JSON. No preamble. No markdown.'
  ].join('\n');
}

/**
 * Builds the user message for Pass 3.
 * Contains the original text, the extraction summary, and the full
 * Pass 2 reading.
 *
 * @param originalText  - The original thought
 * @param extraction    - Pass 1 output (for context)
 * @param reading       - Pass 2 output (primary input for this pass)
 */
export function buildReframeUserMessage(
  originalText: string,
  extraction: ThoughtAnalysis,
  reading: StructuralReading
): string {
  // extraction is accepted for the function signature per spec,
  // but Pass 3 user message uses the reading fields directly
  void extraction;

  return [
    'Original text:',
    `"${originalText}"`,
    '',
    `Structural pattern: ${reading.pattern}`,
    `Deep tension: ${reading.deepTension}`,
    `Hidden assumption: ${reading.hiddenAssumption}`,
    `Subtext: ${reading.subtext}`,
    '',
    'Write a reframe question that opens this structure.'
  ].join('\n');
}
