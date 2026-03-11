import { json, type RequestHandler } from '@sveltejs/kit';

import { saveAnalysis } from '$lib/db';
import type { FullAnalysis } from '$lib/types';

/**
 * Persist route: saves a complete three-pass FullAnalysis to the database.
 *
 * Input:  POST { text: string, fullAnalysis: FullAnalysis }
 * Output: { id: string }
 *
 * Non-fatal — returns 500 on failure but never crashes the server.
 */

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export const POST: RequestHandler = async ({ request }) => {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }

  if (!isRecord(body) || typeof body.text !== 'string' || body.text.trim().length === 0) {
    return json({ error: 'Text is required.' }, { status: 400 });
  }

  if (!isRecord(body.fullAnalysis) || !isRecord((body.fullAnalysis as UnknownRecord).extraction)) {
    return json({ error: 'fullAnalysis with extraction is required.' }, { status: 400 });
  }

  const text = body.text.trim();
  const fullAnalysis = body.fullAnalysis as unknown as FullAnalysis;

  try {
    const id = saveAnalysis(text, fullAnalysis);
    return json({ id });
  } catch (err) {
    console.error('[persist] Failed to save analysis:', err);
    return json({ error: 'Failed to persist analysis.' }, { status: 500 });
  }
};
