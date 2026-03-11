import { describe, expect, it } from 'vitest';

import {
  deriveRateLimitUserKey,
  evaluateExtractRateLimit,
  getExtractRequestCost,
  type ExtractRateLimitConfig
} from '$lib/server/rate-limit';

const config: ExtractRateLimitConfig = {
  maxInputChars: 6000,
  charsPerToken: 1500,
  maxRequestCost: 4,
  hourlyTokenLimit: 12,
  dailyTokenLimit: 40
};

describe('getExtractRequestCost', () => {
  it('caps cost tiers at the configured maximum', () => {
    expect(getExtractRequestCost(0, config)).toBe(1);
    expect(getExtractRequestCost(1, config)).toBe(1);
    expect(getExtractRequestCost(1500, config)).toBe(1);
    expect(getExtractRequestCost(1501, config)).toBe(2);
    expect(getExtractRequestCost(3000, config)).toBe(2);
    expect(getExtractRequestCost(3001, config)).toBe(3);
    expect(getExtractRequestCost(4500, config)).toBe(3);
    expect(getExtractRequestCost(4501, config)).toBe(4);
    expect(getExtractRequestCost(6000, config)).toBe(4);
    expect(getExtractRequestCost(6001, config)).toBe(4);
  });
});

describe('deriveRateLimitUserKey', () => {
  it('stays stable for the same forwarded client identity', () => {
    const request = new Request('http://localhost/api/extract', {
      headers: {
        'user-agent': 'vitest',
        'x-forwarded-for': '203.0.113.8, 10.0.0.1'
      }
    });

    const first = deriveRateLimitUserKey({
      request,
      getClientAddress: () => '127.0.0.1'
    });
    const second = deriveRateLimitUserKey({
      request,
      getClientAddress: () => '127.0.0.1'
    });

    expect(first).toBe(second);
    expect(first).toHaveLength(64);
  });
});

describe('evaluateExtractRateLimit', () => {
  it('rejects oversized input before quota math', () => {
    const decision = evaluateExtractRateLimit([], 6001, config, 1_000_000);

    expect(decision).toEqual({
      allowed: false,
      status: 413,
      payload: {
        error: 'Input exceeds the maximum allowed length.',
        code: 'INPUT_TOO_LONG',
        maxInputChars: 6000
      }
    });
  });

  it('allows a request under both rolling windows', () => {
    const now = 10 * 60 * 60 * 1000;
    const decision = evaluateExtractRateLimit(
      [
        { cost: 3, createdAt: now - 30 * 60 * 1000 },
        { cost: 4, createdAt: now - 2 * 60 * 60 * 1000 }
      ],
      1400,
      config,
      now
    );

    expect(decision).toEqual({
      allowed: true,
      cost: 1,
      remaining: {
        hourlyTokens: 8,
        dailyTokens: 32
      }
    });
  });

  it('returns a retry-after when the hourly budget is exhausted', () => {
    const now = 10 * 60 * 60 * 1000;
    const decision = evaluateExtractRateLimit(
      [
        { cost: 4, createdAt: now - 30 * 60 * 1000 },
        { cost: 4, createdAt: now - 20 * 60 * 1000 },
        { cost: 4, createdAt: now - 10 * 60 * 1000 }
      ],
      100,
      config,
      now
    );

    expect(decision).toEqual({
      allowed: false,
      status: 429,
      retryAfterSeconds: 1800,
      payload: {
        error: 'Rate limit exceeded for analysis requests.',
        code: 'RATE_LIMITED',
        retryAfterSeconds: 1800,
        requestCost: 1,
        limit: {
          hourlyTokens: 12,
          dailyTokens: 40
        },
        remaining: {
          hourlyTokens: 0,
          dailyTokens: 28
        }
      }
    });
  });

  it('returns a retry-after when the daily budget is exhausted', () => {
    const now = 30 * 60 * 60 * 1000;
    const decision = evaluateExtractRateLimit(
      [
        { cost: 4, createdAt: now - 23 * 60 * 60 * 1000 },
        { cost: 4, createdAt: now - 22 * 60 * 60 * 1000 },
        { cost: 4, createdAt: now - 21 * 60 * 60 * 1000 },
        { cost: 4, createdAt: now - 20 * 60 * 60 * 1000 },
        { cost: 4, createdAt: now - 19 * 60 * 60 * 1000 },
        { cost: 4, createdAt: now - 18 * 60 * 60 * 1000 },
        { cost: 4, createdAt: now - 17 * 60 * 60 * 1000 },
        { cost: 4, createdAt: now - 16 * 60 * 60 * 1000 },
        { cost: 4, createdAt: now - 15 * 60 * 60 * 1000 },
        { cost: 4, createdAt: now - 14 * 60 * 60 * 1000 }
      ],
      200,
      config,
      now
    );

    expect(decision).toEqual({
      allowed: false,
      status: 429,
      retryAfterSeconds: 3600,
      payload: {
        error: 'Rate limit exceeded for analysis requests.',
        code: 'RATE_LIMITED',
        retryAfterSeconds: 3600,
        requestCost: 1,
        limit: {
          hourlyTokens: 12,
          dailyTokens: 40
        },
        remaining: {
          hourlyTokens: 12,
          dailyTokens: 0
        }
      }
    });
  });
});
