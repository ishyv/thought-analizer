/**
 * Detects Anthropic API billing / credit-exhaustion errors.
 *
 * Anthropic returns 429 for rate limits AND for billing limits.
 * When credits are exhausted the error body typically contains:
 *   { type: "error", error: { type: "rate_limit_error", message: "..." } }
 * with messages mentioning "credit", "billing", or "exceeded".
 *
 * We also catch 402 (Payment Required) which some providers use.
 */

export interface BillingErrorInfo {
  isBillingError: boolean;
  status: number;
  message: string;
}

const BILLING_KEYWORDS = [
  'credit',
  'billing',
  'payment',
  'balance',
  'exceeded your current quota',
  'insufficient',
  'plan',
  'upgrade'
];

/**
 * Check if an Anthropic API error response indicates a billing/credit issue
 * rather than a transient rate limit.
 */
export function detectBillingError(status: number, errorBody: string): BillingErrorInfo {
  const lower = errorBody.toLowerCase();

  // 402 Payment Required is always a billing issue
  if (status === 402) {
    return { isBillingError: true, status, message: errorBody };
  }

  // 429 could be rate-limit OR billing — check the body for billing keywords
  if (status === 429) {
    const isBilling = BILLING_KEYWORDS.some((kw) => lower.includes(kw));
    if (isBilling) {
      return { isBillingError: true, status, message: errorBody };
    }
  }

  return { isBillingError: false, status, message: errorBody };
}
