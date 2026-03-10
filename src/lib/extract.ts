import { validateAnalysis } from '$lib/analysis';
import { EXTRACTION_FALLBACK, type ThoughtAnalysis } from '$lib/types';

/**
 * Client-side extraction service.
 * Sends input text to the server route and returns a validated ThoughtAnalysis.
 * Never throws - returns a minimal fallback on any failure.
 */

interface ExtractResponse {
  analysis?: unknown;
}

function buildFallbackAnalysis(inputText: string): ThoughtAnalysis {
  return { ...EXTRACTION_FALLBACK, input_text: inputText };
}

/**
 * Sends input text to the extraction route and returns a validated analysis.
 *
 * @param text User-provided thought text to analyze.
 * @returns A validated ThoughtAnalysis, or a minimal fallback when the network,
 * server response, or payload validation fails.
 */
export async function extractAnalysis(text: string): Promise<ThoughtAnalysis> {
  const trimmedText = text.trim();
  const fallback = buildFallbackAnalysis(trimmedText);

  if (!trimmedText) {
    return fallback;
  }

  try {
    const response = await fetch('/api/extract', {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({ text: trimmedText })
    });

    if (!response.ok) {
      return fallback;
    }

    const payload = (await response.json()) as ExtractResponse;
    return validateAnalysis(payload.analysis) ?? fallback;
  } catch {
    return fallback;
  }
}
