import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ThoughtAnalysis } from '$lib/types';

const saveAnalysis = vi.fn();
const checkExtractRateLimit = vi.fn();
const validateAnalysis = vi.fn();

vi.mock('$env/static/private', () => ({
  ANTHROPIC_API_KEY: 'test-api-key'
}));

vi.mock('$lib/db', () => ({
  saveAnalysis
}));

vi.mock('$lib/server/rate-limit', () => ({
  checkExtractRateLimit
}));

vi.mock('$lib/analysis', () => ({
  buildSystemPrompt: () => 'system',
  buildUserMessage: (inputText: string) => inputText,
  EXTRACTION_MAX_RETRIES: 1,
  EXTRACTION_MAX_TOKENS: 512,
  EXTRACTION_MODEL: 'claude-test',
  validateAnalysis
}));

const { POST } = await import('./+server');

const validAnalysis: ThoughtAnalysis = {
  input_text: 'Need blocked by fatigue.',
  extraction_quality: 'full',
  phrase_groups: [],
  statement_groups: [],
  relations: [],
  issues: [],
  summary: 'A thought.'
};

describe('POST /api/extract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  it('returns 413 before calling Anthropic when input is too long', async () => {
    checkExtractRateLimit.mockReturnValue({
      allowed: false,
      status: 413,
      payload: {
        error: 'Input exceeds the maximum allowed length.',
        code: 'INPUT_TOO_LONG',
        maxInputChars: 6000
      }
    });

    const response = await POST({
      request: new Request('http://localhost/api/extract', {
        method: 'POST',
        body: JSON.stringify({ text: 'x'.repeat(6001) }),
        headers: { 'content-type': 'application/json' }
      }),
      getClientAddress: () => '127.0.0.1'
    } as never);

    expect(response.status).toBe(413);
    expect(await response.json()).toEqual({
      error: 'Input exceeds the maximum allowed length.',
      code: 'INPUT_TOO_LONG',
      maxInputChars: 6000
    });
    expect(fetch).not.toHaveBeenCalled();
    expect(saveAnalysis).not.toHaveBeenCalled();
  });

  it('returns 429 with retry-after before calling Anthropic when over quota', async () => {
    checkExtractRateLimit.mockReturnValue({
      allowed: false,
      status: 429,
      retryAfterSeconds: 90,
      payload: {
        error: 'Rate limit exceeded for analysis requests.',
        code: 'RATE_LIMITED',
        retryAfterSeconds: 90,
        requestCost: 1,
        limit: { hourlyTokens: 12, dailyTokens: 40 },
        remaining: { hourlyTokens: 0, dailyTokens: 3 }
      }
    });

    const response = await POST({
      request: new Request('http://localhost/api/extract', {
        method: 'POST',
        body: JSON.stringify({ text: 'short thought' }),
        headers: { 'content-type': 'application/json' }
      }),
      getClientAddress: () => '127.0.0.1'
    } as never);

    expect(response.status).toBe(429);
    expect(response.headers.get('retry-after')).toBe('90');
    expect(await response.json()).toEqual({
      error: 'Rate limit exceeded for analysis requests.',
      code: 'RATE_LIMITED',
      retryAfterSeconds: 90,
      requestCost: 1,
      limit: { hourlyTokens: 12, dailyTokens: 40 },
      remaining: { hourlyTokens: 0, dailyTokens: 3 }
    });
    expect(fetch).not.toHaveBeenCalled();
    expect(saveAnalysis).not.toHaveBeenCalled();
  });

  it('calls Anthropic and saves the validated analysis when allowed', async () => {
    checkExtractRateLimit.mockReturnValue({
      allowed: true,
      cost: 1,
      remaining: { hourlyTokens: 11, dailyTokens: 39 }
    });
    validateAnalysis.mockReturnValue(validAnalysis);
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          content: [{ type: 'text', text: JSON.stringify(validAnalysis) }]
        }),
        { status: 200 }
      )
    );

    const response = await POST({
      request: new Request('http://localhost/api/extract', {
        method: 'POST',
        body: JSON.stringify({ text: 'Need blocked by fatigue.' }),
        headers: { 'content-type': 'application/json' }
      }),
      getClientAddress: () => '127.0.0.1'
    } as never);

    expect(response.status).toBe(200);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(saveAnalysis).toHaveBeenCalledWith('Need blocked by fatigue.', validAnalysis);
    expect(await response.json()).toEqual({ analysis: validAnalysis });
  });
});
