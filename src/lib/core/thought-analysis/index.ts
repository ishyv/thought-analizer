/**
 * Thought-analysis core public API.
 *
 * Import pure domain types and helpers from here when adding new modules.
 * Legacy wrappers under `$lib/types` and `$lib/active-set` remain for
 * incremental migration of existing callers.
 */

export * from '$lib/core/thought-analysis/model';
export * from '$lib/core/thought-analysis/selection';
export { deriveActiveSet } from '$lib/core/thought-analysis/derive-active-set';
