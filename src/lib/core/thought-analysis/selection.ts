/**
 * Shared analysis-selection model.
 *
 * This module contains the stable types and empty-state constants used by the
 * UI stores and by pure highlight derivation helpers.
 *
 * Invariants:
 * - Empty sets mean "no active entity" rather than "missing data".
 * - `selected*` wins over `hovered*` when both are present in the UI flow.
 *
 * Limits:
 * - No Svelte dependencies live here.
 * - This file models state; it does not mutate it.
 */

/** Selectable entity kinds that can participate in cross-panel highlighting. */
export type SelectableKind = 'phrase' | 'statement' | 'relation' | 'issue';

/** Current hover and persistent selection ids for the active analysis view. */
export interface SelectionState {
  hoveredId: string | null;
  hoveredKind: SelectableKind | null;
  selectedId: string | null;
  selectedKind: SelectableKind | null;
}

/** Expanded highlight sets derived from the current hover or selection state. */
export interface ActiveSet {
  phraseIds: Set<string>;
  statementIds: Set<string>;
  relationIds: Set<string>;
  issueIds: Set<string>;
}

/** Empty baseline used when nothing is hovered or selected. */
export const EMPTY_SELECTION_STATE: SelectionState = {
  hoveredId: null,
  hoveredKind: null,
  selectedId: null,
  selectedKind: null
};

/** Empty highlight set returned when the UI has no active entity. */
export const EMPTY_ACTIVE_SET: ActiveSet = {
  phraseIds: new Set(),
  statementIds: new Set(),
  relationIds: new Set(),
  issueIds: new Set()
};
