import { ANTHROPIC_API_KEY } from '$env/static/private';
import { json, type RequestHandler } from '@sveltejs/kit';

import {
  buildReadingSystemPrompt,
  buildReadingUserMessage,
  EXTRACTION_MAX_RETRIES,
  EXTRACTION_MODEL,
  READING_FALLBACK,
  READING_MAX_TOKENS,
  validateReading
} from '$lib/analysis';
import { findCachedAnalysis, normalizeText, updateReading } from '$lib/db';
import { detectBillingError } from '$lib/server/billing-error';
import type { StructuralReading, ThoughtAnalysis } from '$lib/types';

/**
 * Pass 2 server route: deep structural reading.
 *
 * Accepts the original text and the Pass 1 extraction.
 * Returns a StructuralReading.
 *
 * Input:  POST { text: string, extraction: ThoughtAnalysis }
 * Output: { reading: StructuralReading }
 *
 * Never throws — returns READING_FALLBACK on all failure paths.
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

async function callReadingAPI(
  text: string,
  extraction: ThoughtAnalysis
): Promise<StructuralReading | null> {
  const response = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'anthropic-version': ANTHROPIC_VERSION,
      'content-type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY
    },
    body: JSON.stringify({
      model: EXTRACTION_MODEL,
      max_tokens: READING_MAX_TOKENS,
      system: buildReadingSystemPrompt(),
      messages: [
        {
          role: 'user',
          content: [{ type: 'text', text: buildReadingUserMessage(text, extraction) }]
        }
      ]
    })
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '(unreadable)');
    console.error('[read] Anthropic API error', response.status, errorBody);

    const billing = detectBillingError(response.status, errorBody);
    if (billing.isBillingError) {
      throw new Error('BILLING_LIMIT');
    }

    return null;
  }

  const rawResponse: unknown = await response.json();
  const responseText = extractResponseText(rawResponse);

  if (!responseText) {
    console.error('[read] No text block in response');
    return null;
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(stripCodeFences(responseText));
  } catch {
    console.error('[read] JSON parse failed, raw text:', responseText.slice(0, 200));
    return null;
  }

  const reading = validateReading(parsed);

  if (!reading) {
    console.error('[read] Validation failed, parsed object:', JSON.stringify(parsed).slice(0, 400));
  }

  return reading;
}

export const POST: RequestHandler = async ({ request, url }) => {
  if (!ANTHROPIC_API_KEY) {
    return json({ reading: READING_FALLBACK });
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

  const text = body.text.trim();
  const normalizedText = normalizeText(text);
  const extraction = body.extraction as unknown as ThoughtAnalysis;

  // Check cache unless ?cache=false is specified
  const useCache = url.searchParams.get('cache') !== 'false';

  if (useCache) {
    const cached = findCachedAnalysis(normalizedText);
    if (cached?.reading) {
      console.log('[read] Cache hit for normalized text');
      return json({ reading: cached.reading }, { headers: { 'x-cache': 'HIT' } });
    }
  }

  for (let attempt = 1; attempt <= EXTRACTION_MAX_RETRIES; attempt++) {
    try {
      const reading = await callReadingAPI(text, extraction);

      if (reading) {
        // Cache the reading result
        try {
          updateReading(normalizedText, reading);
        } catch (err) {
          console.warn('[read] Failed to cache reading:', err);
        }
        return json({ reading }, { headers: { 'x-cache': 'MISS' } });
      }

      console.warn(`[read] Attempt ${attempt}/${EXTRACTION_MAX_RETRIES} failed, retrying...`);
    } catch (err) {
      if (err instanceof Error && err.message === 'BILLING_LIMIT') {
        console.error('[read] Anthropic billing limit reached — aborting');
        return json(
          { error: 'API billing limit reached.', code: 'BILLING_LIMIT' },
          { status: 503 }
        );
      }
      console.error(`[read] Unexpected error on attempt ${attempt}:`, err);
    }
  }

  return json({ reading: READING_FALLBACK }, { headers: { 'x-cache': 'MISS' } });
};
