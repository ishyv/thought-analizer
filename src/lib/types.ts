/**
 * Legacy wrapper for the thought-analysis domain model.
 *
 * WHY:
 * - Existing callers still import from `$lib/types`.
 *
 * RISK:
 * - Removing this wrapper in one shot would create avoidable churn.
 *
 * ALT:
 * - A full-path migration in one PR. Rejected to keep this refactor small.
 */

export * from '$lib/core/thought-analysis/model';
