import { ANTHROPIC_API_KEY } from '$env/static/private';
import { json, type RequestHandler } from '@sveltejs/kit';

import {
  buildSystemPrompt,
  buildUserMessage,
  EXTRACTION_MAX_RETRIES,
  EXTRACTION_MAX_TOKENS,
  EXTRACTION_MODEL,
  validateAnalysis
} from '$lib/analysis';
import { saveAnalysis } from '$lib/db';
import { checkExtractRateLimit } from '$lib/server/rate-limit';
import { EXTRACTION_FALLBACK, type ThoughtAnalysis } from '$lib/types';

/**
 * Server-side extraction route.
 * Owns the Anthropic API call, prompt construction, and response validation.
 * Retries up to EXTRACTION_MAX_RETRIES times when the model returns an
 * invalid or unparseable response. The UI never receives unvalidated data.
 */

type UnknownRecord = Record<string, unknown>;

// ── Config ──────────────────────────────────────────────────

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';

// ── Helpers ──────────────────────────────────────────────────

function buildFallbackAnalysis(inputText: string): ThoughtAnalysis {
  return { ...EXTRACTION_FALLBACK, input_text: inputText };
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function extractResponseText(value: unknown): string | null {
  if (!isRecord(value) || !Array.isArray(value.content)) return null;

  for (const block of value.content) {
    if (isRecord(block) && block.type === 'text' && typeof block.text === 'string') {
      return block.text;
    }
  }

  return null;
}

/** Strips markdown code fences that some models add despite instructions. */
function stripCodeFences(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
}

// ── API call ─────────────────────────────────────────────────

async function callAnthropicAPI(inputText: string): Promise<ThoughtAnalysis | null> {
  const response = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'anthropic-version': ANTHROPIC_VERSION,
      'content-type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY
    },
    body: JSON.stringify({
      model: EXTRACTION_MODEL,
      max_tokens: EXTRACTION_MAX_TOKENS,
      system: buildSystemPrompt(),
      messages: [{ role: 'user', content: [{ type: 'text', text: buildUserMessage(inputText) }] }]
    })
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '(unreadable)');
    console.error('[extract] Anthropic API error', response.status, errorBody);
    return null;
  }

  const rawResponse = await response.json();
  const responseText = extractResponseText(rawResponse);

  if (!responseText) {
    console.error('[extract] No text block in response');
    return null;
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(stripCodeFences(responseText));
  } catch {
    console.error('[extract] JSON parse failed, raw text:', responseText.slice(0, 200));
    return null;
  }

  const analysis = validateAnalysis(parsed);

  if (!analysis) {
    console.error('[extract] Validation failed, parsed object:', JSON.stringify(parsed).slice(0, 400));
  }

  return analysis;
}

// ── Request handler ─────────────────────────────────────────

export const POST: RequestHandler = async (event) => {
  const { request } = event;

  if (!ANTHROPIC_API_KEY) {
    return json({ error: 'ANTHROPIC_API_KEY is not configured.' }, { status: 500 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }

  if (!isRecord(body) || typeof body.text !== 'string' || body.text.trim().length === 0) {
    return json({ error: 'Text is required.' }, { status: 400 });
  }

  const inputText = body.text.trim();
  const rateLimitDecision = checkExtractRateLimit(event, inputText.length);

  if (!rateLimitDecision.allowed) {
    const headers = rateLimitDecision.retryAfterSeconds
      ? { 'retry-after': String(rateLimitDecision.retryAfterSeconds) }
      : undefined;

    return json(rateLimitDecision.payload, {
      status: rateLimitDecision.status,
      headers
    });
  }

  const fallback = buildFallbackAnalysis(inputText);

  for (let attempt = 1; attempt <= EXTRACTION_MAX_RETRIES; attempt++) {
    try {
      const analysis = await callAnthropicAPI(inputText);

      if (analysis) {
        const result = { ...analysis, input_text: inputText };
        try {
          saveAnalysis(inputText, result);
        } catch (err) {
          console.warn('[extract] Failed to persist analysis:', err);
        }
        return json({ analysis: result });
      }

      console.warn(`[extract] Attempt ${attempt}/${EXTRACTION_MAX_RETRIES} failed, retrying...`);
    } catch (err) {
      console.error(`[extract] Unexpected error on attempt ${attempt}:`, err);
    }
  }

  try {
    saveAnalysis(inputText, fallback);
  } catch (err) {
    console.warn('[extract] Failed to persist fallback analysis:', err);
  }

  return json({ analysis: fallback });
};
