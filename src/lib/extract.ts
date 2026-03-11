import { validateAnalysis, validateReading, validateReframe } from '$lib/analysis';
import {
  ExtractRequestError,
  type ExtractRateLimitCode,
  type ExtractRateLimitErrorPayload
} from '$lib/rate-limit';
import {
  EXTRACTION_FALLBACK,
  type FullAnalysis,
  type PipelinePhase,
  type ReframeQuestion,
  type StructuralReading,
  type ThoughtAnalysis
} from '$lib/types';

import { READING_FALLBACK, REFRAME_FALLBACK } from '$lib/analysis/config';
import { browser } from '$app/environment';

/**
 * Multi-pass extraction service.
 *
 * Orchestrates three sequential API calls and reports progress
 * via a callback so the UI can update between passes.
 *
 * Never throws — each pass has a fallback. A failed pass does not
 * prevent subsequent passes from running.
 */

// ── Types ────────────────────────────────────────────────────

interface ExtractResponse {
  analysis?: unknown;
}

interface ReadResponse {
  reading?: unknown;
}

interface ReframeResponse {
  reframe?: unknown;
}

/**
 * Called after each pass completes with the current partial result.
 * Drives the progressive reveal in the UI.
 */
export type ProgressCallback = (
  phase: PipelinePhase,
  partial: Partial<FullAnalysis>
) => void;

// ── Rate limit helpers (reused from existing extract.ts) ────

function isRateLimitCode(value: unknown): value is ExtractRateLimitCode {
  return value === 'INPUT_TOO_LONG' || value === 'RATE_LIMITED';
}

async function readErrorPayload(response: Response): Promise<ExtractRateLimitErrorPayload | null> {
  try {
    const payload = (await response.json()) as unknown;

    if (typeof payload !== 'object' || payload === null) {
      return null;
    }

    const candidate = payload as Partial<ExtractRateLimitErrorPayload>;

    if (typeof candidate.error !== 'string' || !isRateLimitCode(candidate.code)) {
      return null;
    }

    return {
      error: candidate.error,
      code: candidate.code,
      maxInputChars: candidate.maxInputChars,
      retryAfterSeconds: candidate.retryAfterSeconds,
      requestCost: candidate.requestCost,
      limit: candidate.limit,
      remaining: candidate.remaining
    };
  } catch {
    return null;
  }
}

// ── Billing limit redirect ──────────────────────────────────

async function checkBillingLimit(response: Response): Promise<boolean> {
  if (response.status === 503) {
    try {
      const cloned = response.clone();
      const body = (await cloned.json()) as { code?: string };
      if (body.code === 'BILLING_LIMIT') {
        if (browser) {
          window.location.href = '/drifting';
        }
        return true;
      }
    } catch { /* not a billing error */ }
  }
  return false;
}

// ── Private fetch helpers ────────────────────────────────────

function buildFallbackAnalysis(inputText: string): ThoughtAnalysis {
  return { ...EXTRACTION_FALLBACK, input_text: inputText };
}

async function fetchExtraction(text: string): Promise<ThoughtAnalysis> {
  const fallback = buildFallbackAnalysis(text);

  try {
    const response = await fetch('/api/extract', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text })
    });

    if (await checkBillingLimit(response)) {
      // Will never reach here in browser — redirect happens above.
      // Return fallback for SSR / non-browser safety.
      return fallback;
    }

    if (!response.ok) {
      if (response.status === 413 || response.status === 429) {
        throw new ExtractRequestError(response.status, await readErrorPayload(response));
      }

      return fallback;
    }

    const payload = (await response.json()) as ExtractResponse;
    return validateAnalysis(payload.analysis) ?? fallback;
  } catch (err) {
    // Re-throw rate limit errors so the UI can display them
    if (err instanceof ExtractRequestError) throw err;
    return fallback;
  }
}

async function fetchReading(
  text: string,
  extraction: ThoughtAnalysis
): Promise<StructuralReading> {
  try {
    const response = await fetch('/api/read', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text, extraction })
    });

    if (await checkBillingLimit(response)) {
      return READING_FALLBACK;
    }

    if (!response.ok) {
      return READING_FALLBACK;
    }

    const payload = (await response.json()) as ReadResponse;
    return validateReading(payload.reading) ?? READING_FALLBACK;
  } catch {
    return READING_FALLBACK;
  }
}

async function fetchReframe(
  text: string,
  extraction: ThoughtAnalysis,
  reading: StructuralReading
): Promise<ReframeQuestion> {
  try {
    const response = await fetch('/api/reframe', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text, extraction, reading })
    });

    if (await checkBillingLimit(response)) {
      return REFRAME_FALLBACK;
    }

    if (!response.ok) {
      return REFRAME_FALLBACK;
    }

    const payload = (await response.json()) as ReframeResponse;
    return validateReframe(payload.reframe) ?? REFRAME_FALLBACK;
  } catch {
    return REFRAME_FALLBACK;
  }
}

// ── Public API ───────────────────────────────────────────────

/**
 * Runs the full three-pass pipeline.
 *
 * @param text        - The raw thought text
 * @param onProgress  - Called after each pass with the current state
 * @returns           The complete FullAnalysis (all three passes)
 */
export async function runPipeline(
  text: string,
  onProgress: ProgressCallback
): Promise<FullAnalysis> {
  // Pass 1 — structural extraction
  onProgress('extracting', {});
  const extraction = await fetchExtraction(text);

  // Pass 2 — deep structural reading
  onProgress('reading', { extraction, reading: null, reframe: null });
  const reading = await fetchReading(text, extraction);

  // Pass 3 — reframe question
  onProgress('reframing', { extraction, reading, reframe: null });
  const reframe = await fetchReframe(text, extraction, reading);

  onProgress('complete', { extraction, reading, reframe });
  return { extraction, reading, reframe };
}

/**
 * Legacy single-pass extraction (kept for backward compatibility).
 * Calls only Pass 1 and returns a ThoughtAnalysis.
 *
 * @param text User-provided thought text to analyze.
 * @returns A validated ThoughtAnalysis, or a minimal fallback.
 */
export async function extractAnalysis(text: string): Promise<ThoughtAnalysis> {
  const trimmedText = text.trim();

  if (!trimmedText) {
    return buildFallbackAnalysis(trimmedText);
  }

  return fetchExtraction(trimmedText);
}
