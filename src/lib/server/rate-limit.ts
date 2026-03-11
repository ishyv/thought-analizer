import { createHash } from 'node:crypto';

import type { RequestEvent } from '@sveltejs/kit';

import {
  listAcceptedRateLimitEvents,
  pruneRateLimitEvents,
  recordRateLimitEvent
} from '$lib/db';
import type { ExtractRateLimitErrorPayload } from '$lib/rate-limit';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const RETENTION_MS = 7 * DAY_MS;
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
const ROUTE_KEY = 'extract';

export interface AcceptedRateLimitEvent {
  cost: number;
  createdAt: number;
}

export interface ExtractRateLimitConfig {
  maxInputChars: number;
  charsPerToken: number;
  maxRequestCost: number;
  hourlyTokenLimit: number;
  dailyTokenLimit: number;
}

export type ExtractRateLimitDecision =
  | {
      allowed: true;
      cost: number;
      remaining: {
        hourlyTokens: number;
        dailyTokens: number;
      };
    }
  | {
      allowed: false;
      status: 413 | 429;
      payload: ExtractRateLimitErrorPayload;
      retryAfterSeconds?: number;
    };

const DEFAULT_CONFIG: ExtractRateLimitConfig = {
  maxInputChars: 6000,
  charsPerToken: 1500,
  maxRequestCost: 4,
  hourlyTokenLimit: 12,
  dailyTokenLimit: 40
};

type StoredDecision = 'accepted' | 'rate_limited' | 'input_too_long';
type StoredEvent = AcceptedRateLimitEvent & { inputChars: number; decision: StoredDecision };

const memoryEvents = new Map<string, StoredEvent[]>();
let lastCleanupAt = 0;
let warnedAboutMemoryFallback = false;

function readPositiveInt(envName: string, fallback: number): number {
  const rawValue = process.env[envName]?.trim();

  if (!rawValue) {
    return fallback;
  }

  const parsed = Number.parseInt(rawValue, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function getExtractRateLimitConfig(): ExtractRateLimitConfig {
  return {
    maxInputChars: readPositiveInt('EXTRACT_MAX_INPUT_CHARS', DEFAULT_CONFIG.maxInputChars),
    charsPerToken: readPositiveInt('EXTRACT_RATE_LIMIT_CHARS_PER_TOKEN', DEFAULT_CONFIG.charsPerToken),
    maxRequestCost: readPositiveInt('EXTRACT_RATE_LIMIT_MAX_REQUEST_COST', DEFAULT_CONFIG.maxRequestCost),
    hourlyTokenLimit: readPositiveInt(
      'EXTRACT_RATE_LIMIT_HOURLY_TOKENS',
      DEFAULT_CONFIG.hourlyTokenLimit
    ),
    dailyTokenLimit: readPositiveInt(
      'EXTRACT_RATE_LIMIT_DAILY_TOKENS',
      DEFAULT_CONFIG.dailyTokenLimit
    )
  };
}

function hashIdentifier(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function resolveClientIp(event: Pick<RequestEvent, 'request' | 'getClientAddress'>): string {
  const forwardedFor = event.request.headers.get('x-forwarded-for');

  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || 'unknown';
  }

  const realIp = event.request.headers.get('x-real-ip') ?? event.request.headers.get('cf-connecting-ip');
  if (realIp) {
    return realIp.trim();
  }

  try {
    return event.getClientAddress();
  } catch {
    return 'unknown';
  }
}

export function deriveRateLimitUserKey(
  event: Pick<RequestEvent, 'request' | 'getClientAddress'>
): string {
  const ip = resolveClientIp(event);
  const userAgent = event.request.headers.get('user-agent')?.trim() || 'unknown';

  return hashIdentifier(`${ip}|${userAgent}`);
}

export function getExtractRequestCost(
  inputChars: number,
  config: ExtractRateLimitConfig = getExtractRateLimitConfig()
): number {
  if (inputChars <= 0) {
    return 1;
  }

  const computedCost = Math.ceil(inputChars / config.charsPerToken);
  return Math.max(1, Math.min(config.maxRequestCost, computedCost));
}

function sumCosts(events: AcceptedRateLimitEvent[]): number {
  return events.reduce((total, event) => total + event.cost, 0);
}

function getRetryAfterSeconds(
  events: AcceptedRateLimitEvent[],
  cost: number,
  limit: number,
  windowMs: number,
  now: number
): number {
  const activeEvents = events.filter((event) => event.createdAt >= now - windowMs);
  let remainingCost = sumCosts(activeEvents);

  if (remainingCost + cost <= limit) {
    return 0;
  }

  for (const event of activeEvents) {
    remainingCost -= event.cost;

    if (remainingCost + cost <= limit) {
      return Math.max(1, Math.ceil((event.createdAt + windowMs - now) / 1000));
    }
  }

  return Math.ceil(windowMs / 1000);
}

export function evaluateExtractRateLimit(
  events: AcceptedRateLimitEvent[],
  inputChars: number,
  config: ExtractRateLimitConfig = getExtractRateLimitConfig(),
  now = Date.now()
): ExtractRateLimitDecision {
  if (inputChars > config.maxInputChars) {
    return {
      allowed: false,
      status: 413,
      payload: {
        error: 'Input exceeds the maximum allowed length.',
        code: 'INPUT_TOO_LONG',
        maxInputChars: config.maxInputChars
      }
    };
  }

  const cost = getExtractRequestCost(inputChars, config);
  const hourlyEvents = events.filter((event) => event.createdAt >= now - HOUR_MS);
  const dailyEvents = events.filter((event) => event.createdAt >= now - DAY_MS);

  const hourlyUsed = sumCosts(hourlyEvents);
  const dailyUsed = sumCosts(dailyEvents);

  if (hourlyUsed + cost > config.hourlyTokenLimit || dailyUsed + cost > config.dailyTokenLimit) {
    const retryAfterSeconds = Math.max(
      getRetryAfterSeconds(dailyEvents, cost, config.dailyTokenLimit, DAY_MS, now),
      getRetryAfterSeconds(hourlyEvents, cost, config.hourlyTokenLimit, HOUR_MS, now)
    );

    return {
      allowed: false,
      status: 429,
      retryAfterSeconds,
      payload: {
        error: 'Rate limit exceeded for analysis requests.',
        code: 'RATE_LIMITED',
        retryAfterSeconds,
        requestCost: cost,
        limit: {
          hourlyTokens: config.hourlyTokenLimit,
          dailyTokens: config.dailyTokenLimit
        },
        remaining: {
          hourlyTokens: Math.max(0, config.hourlyTokenLimit - hourlyUsed),
          dailyTokens: Math.max(0, config.dailyTokenLimit - dailyUsed)
        }
      }
    };
  }

  return {
    allowed: true,
    cost,
    remaining: {
      hourlyTokens: Math.max(0, config.hourlyTokenLimit - (hourlyUsed + cost)),
      dailyTokens: Math.max(0, config.dailyTokenLimit - (dailyUsed + cost))
    }
  };
}

function getMemoryKey(userKey: string): string {
  return `${ROUTE_KEY}:${userKey}`;
}

function pruneMemoryEvents(now: number): void {
  const cutoff = now - RETENTION_MS;

  for (const [key, events] of memoryEvents.entries()) {
    const retained = events.filter((event) => event.createdAt >= cutoff);

    if (retained.length === 0) {
      memoryEvents.delete(key);
      continue;
    }

    memoryEvents.set(key, retained);
  }
}

function runRateLimitCleanup(now: number): void {
  if (now - lastCleanupAt < CLEANUP_INTERVAL_MS) {
    return;
  }

  lastCleanupAt = now;
  const cutoff = now - RETENTION_MS;

  try {
    pruneRateLimitEvents(cutoff);
  } catch {
    pruneMemoryEvents(now);
  }
}

function loadAcceptedEvents(userKey: string, now: number): AcceptedRateLimitEvent[] {
  const cutoff = now - DAY_MS;

  try {
    return listAcceptedRateLimitEvents(userKey, ROUTE_KEY, cutoff);
  } catch {
    if (!warnedAboutMemoryFallback) {
      warnedAboutMemoryFallback = true;
      console.warn('[rate-limit] SQLite unavailable, falling back to in-memory counters.');
    }

    return (memoryEvents.get(getMemoryKey(userKey)) ?? [])
      .filter((event) => event.decision === 'accepted' && event.createdAt >= cutoff)
      .map((event) => ({ cost: event.cost, createdAt: event.createdAt }));
  }
}

function persistRateLimitEvent(
  userKey: string,
  decision: StoredDecision,
  cost: number,
  inputChars: number,
  createdAt: number
): void {
  try {
    recordRateLimitEvent({
      userKey,
      routeKey: ROUTE_KEY,
      decision,
      cost,
      inputChars,
      createdAt
    });
    return;
  } catch {
    const key = getMemoryKey(userKey);
    const events = memoryEvents.get(key) ?? [];
    events.push({ decision, cost, inputChars, createdAt });
    memoryEvents.set(key, events);
  }
}

export function checkExtractRateLimit(
  event: Pick<RequestEvent, 'request' | 'getClientAddress'>,
  inputChars: number,
  now = Date.now()
): ExtractRateLimitDecision {
  runRateLimitCleanup(now);

  const userKey = deriveRateLimitUserKey(event);
  const acceptedEvents = loadAcceptedEvents(userKey, now);
  const decision = evaluateExtractRateLimit(acceptedEvents, inputChars, getExtractRateLimitConfig(), now);

  if (decision.allowed) {
    persistRateLimitEvent(userKey, 'accepted', decision.cost, inputChars, now);
    return decision;
  }

  const storedDecision = decision.status === 413 ? 'input_too_long' : 'rate_limited';
  persistRateLimitEvent(userKey, storedDecision, 0, inputChars, now);

  return decision;
}
