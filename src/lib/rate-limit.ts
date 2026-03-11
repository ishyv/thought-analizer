export type ExtractRateLimitCode = 'INPUT_TOO_LONG' | 'RATE_LIMITED';

export interface ExtractRateLimitErrorPayload {
  error: string;
  code: ExtractRateLimitCode;
  maxInputChars?: number;
  retryAfterSeconds?: number;
  requestCost?: number;
  limit?: {
    hourlyTokens: number;
    dailyTokens: number;
  };
  remaining?: {
    hourlyTokens: number;
    dailyTokens: number;
  };
}

export class ExtractRequestError extends Error {
  readonly status: number;
  readonly payload: ExtractRateLimitErrorPayload | null;

  constructor(status: number, payload: ExtractRateLimitErrorPayload | null) {
    super(formatExtractRequestErrorMessage(status, payload));
    this.name = 'ExtractRequestError';
    this.status = status;
    this.payload = payload;
  }
}

export function isExtractRequestError(error: unknown): error is ExtractRequestError {
  return error instanceof ExtractRequestError;
}

export function formatExtractRequestErrorMessage(
  status: number,
  payload: ExtractRateLimitErrorPayload | null
): string {
  if (payload?.code === 'INPUT_TOO_LONG' && payload.maxInputChars) {
    return `That input is too long. Keep it under ${payload.maxInputChars.toLocaleString()} characters.`;
  }

  if (payload?.code === 'RATE_LIMITED') {
    const retryAfterSeconds = payload.retryAfterSeconds ?? 0;

    if (retryAfterSeconds >= 3600) {
      const hours = Math.ceil(retryAfterSeconds / 3600);
      return `Too many analyses from this client. Try again in about ${hours} hour${hours === 1 ? '' : 's'}.`;
    }

    if (retryAfterSeconds >= 60) {
      const minutes = Math.ceil(retryAfterSeconds / 60);
      return `Too many analyses from this client. Try again in about ${minutes} minute${minutes === 1 ? '' : 's'}.`;
    }

    return 'Too many analyses from this client. Try again shortly.';
  }

  if (status === 413) {
    return 'That input is too long.';
  }

  if (status === 429) {
    return 'Too many analyses right now. Try again shortly.';
  }

  return 'Analysis failed. Try again.';
}
