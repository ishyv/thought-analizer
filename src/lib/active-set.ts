/**
 * Legacy wrapper around the thought-analysis active-set core module.
 *
 * WHY:
 * - Existing imports still point at `$lib/active-set`.
 *
 * IMPACT:
 * - New code can import from `$lib/core/thought-analysis`.
 * - Old code keeps working while we migrate incrementally.
 */

export { deriveActiveSet } from '$lib/core/thought-analysis/derive-active-set';
export { EMPTY_ACTIVE_SET } from '$lib/core/thought-analysis/selection';
export type { ActiveSet, SelectableKind } from '$lib/core/thought-analysis/selection';
