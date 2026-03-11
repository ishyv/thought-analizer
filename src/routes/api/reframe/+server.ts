import { ANTHROPIC_API_KEY } from '$env/static/private';
import { json, type RequestHandler } from '@sveltejs/kit';

import {
  buildReframeSystemPrompt,
  buildReframeUserMessage,
  EXTRACTION_MAX_RETRIES,
  EXTRACTION_MODEL,
  REFRAME_FALLBACK,
  REFRAME_MAX_TOKENS,
  validateReframe
} from '$lib/analysis';
import { findCachedAnalysis, normalizeText, updateReframe } from '$lib/db';
import type { ReframeQuestion, StructuralReading, ThoughtAnalysis } from '$lib/types';

/**
 * Pass 3 server route: reframe question.
 *
 * Accepts the original text, Pass 1 extraction, and Pass 2 reading.
 * Returns a ReframeQuestion.
 *
 * Input:  POST { text: string, extraction: ThoughtAnalysis, reading: StructuralReading }
 * Output: { reframe: ReframeQuestion }
 *
 * Never throws — returns REFRAME_FALLBACK on all failure paths.
 */

type UnknownRecord = Record<string, unknown>;

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';

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
  return text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim();
}

async function callReframeAPI(
  text: string,
  extraction: ThoughtAnalysis,
  reading: StructuralReading
): Promise<ReframeQuestion | null> {
  const response = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'anthropic-version': ANTHROPIC_VERSION,
      'content-type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY
    },
    body: JSON.stringify({
      model: EXTRACTION_MODEL,
      max_tokens: REFRAME_MAX_TOKENS,
      system: buildReframeSystemPrompt(),
      messages: [
        {
          role: 'user',
          content: [{ type: 'text', text: buildReframeUserMessage(text, extraction, reading) }]
        }
      ]
    })
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '(unreadable)');
    console.error('[reframe] Anthropic API error', response.status, errorBody);
    return null;
  }

  const rawResponse: unknown = await response.json();
  const responseText = extractResponseText(rawResponse);

  if (!responseText) {
    console.error('[reframe] No text block in response');
    return null;
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(stripCodeFences(responseText));
  } catch {
    console.error('[reframe] JSON parse failed, raw text:', responseText.slice(0, 200));
    return null;
  }

  const reframe = validateReframe(parsed);

  if (!reframe) {
    console.error(
      '[reframe] Validation failed, parsed object:',
      JSON.stringify(parsed).slice(0, 400)
    );
  }

  return reframe;
}

export const POST: RequestHandler = async ({ request, url }) => {
  if (!ANTHROPIC_API_KEY) {
    return json({ reframe: REFRAME_FALLBACK });
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

  if (!isRecord(body.extraction)) {
    return json({ error: 'Extraction is required.' }, { status: 400 });
  }

  if (!isRecord(body.reading)) {
    return json({ error: 'Reading is required.' }, { status: 400 });
  }

  const text = body.text.trim();
  const normalizedText = normalizeText(text);
  const extraction = body.extraction as unknown as ThoughtAnalysis;
  const reading = body.reading as unknown as StructuralReading;

  // Check cache unless ?cache=false is specified
  const useCache = url.searchParams.get('cache') !== 'false';

  if (useCache) {
    const cached = findCachedAnalysis(normalizedText);
    if (cached?.reframe) {
      console.log('[reframe] Cache hit for normalized text');
      return json({ reframe: cached.reframe }, { headers: { 'x-cache': 'HIT' } });
    }
  }

  for (let attempt = 1; attempt <= EXTRACTION_MAX_RETRIES; attempt++) {
    try {
      const reframe = await callReframeAPI(text, extraction, reading);

      if (reframe) {
        // Cache the reframe result
        try {
          updateReframe(normalizedText, reframe);
        } catch (err) {
          console.warn('[reframe] Failed to cache reframe:', err);
        }
        return json({ reframe }, { headers: { 'x-cache': 'MISS' } });
      }

      console.warn(`[reframe] Attempt ${attempt}/${EXTRACTION_MAX_RETRIES} failed, retrying...`);
    } catch (err) {
      console.error(`[reframe] Unexpected error on attempt ${attempt}:`, err);
    }
  }

  return json({ reframe: REFRAME_FALLBACK }, { headers: { 'x-cache': 'MISS' } });
};
