import { derived, writable, type Readable } from 'svelte/store';

import type { IssueType, PhraseType, Polarity, ThoughtAnalysis } from '$lib/types';

import { deriveActiveSet, EMPTY_ACTIVE_SET } from '$lib/active-set';

/**
 * Selection state for the Thought Structure analysis view.
 *
 * This module manages cross-panel hover and selection coordination.
 * No component writes to this store directly - all mutations go through the
 * `selection` action object.
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

const INITIAL_STATE: SelectionState = {
  hoveredId: null,
  hoveredKind: null,
  selectedId: null,
  selectedKind: null
};

/** Writable store holding the current hover and persistent selection state. */
export const selectionState = writable<SelectionState>(INITIAL_STATE);

/** Action object for mutating analysis selection state in a single place. */
export const selection = {
  hover(id: string, kind: SelectableKind): void {
    selectionState.update((state) => ({ ...state, hoveredId: id, hoveredKind: kind }));
  },

  hoverLeave(): void {
    selectionState.update((state) => ({ ...state, hoveredId: null, hoveredKind: null }));
  },

  select(id: string, kind: SelectableKind): void {
    selectionState.update((state) => {
      if (state.selectedId === id) {
        return { ...state, selectedId: null, selectedKind: null };
      }

      return { ...state, selectedId: id, selectedKind: kind };
    });
  },

  reset(): void {
    selectionState.update((state) => ({ ...state, selectedId: null, selectedKind: null }));
  },

  resetSelection(): void {
    selection.reset();
  }
};

/**
 * Filter state for the analysis view.
 *
 * Empty set = no filter active = show everything.
 * A non-empty set means "show only these values."
 */
export interface FilterState {
  polarities: Set<Polarity>;
  phraseTypes: Set<PhraseType>;
  issueTypes: Set<IssueType>;
}

const INITIAL_FILTER: FilterState = {
  polarities: new Set(),
  phraseTypes: new Set(),
  issueTypes: new Set()
};

/** Writable store holding the current filter state. */
export const filterState = writable<FilterState>(INITIAL_FILTER);

/** Action object for toggling analysis filters. */
export const filter = {
  togglePolarity(p: Polarity): void {
    filterState.update((state) => {
      const next = new Set(state.polarities);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return { ...state, polarities: next };
    });
  },

  togglePhraseType(t: PhraseType): void {
    filterState.update((state) => {
      const next = new Set(state.phraseTypes);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return { ...state, phraseTypes: next };
    });
  },

  toggleIssueType(t: IssueType): void {
    filterState.update((state) => {
      const next = new Set(state.issueTypes);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return { ...state, issueTypes: next };
    });
  },

  clearAll(): void {
    filterState.set(INITIAL_FILTER);
  }
};

/**
 * Creates a derived store containing all entities that should be highlighted.
 *
 * @param analysis Validated analysis driving the current view.
 * @returns A derived store of related phrase, statement, relation, and issue ids.
 */
export function createActiveSetStore(analysis: ThoughtAnalysis): Readable<ActiveSet> {
  return derived(selectionState, ($selection) => {
    const activeId = $selection.selectedId ?? $selection.hoveredId;
    const activeKind = $selection.selectedKind ?? $selection.hoveredKind;

    if (!activeId || !activeKind) {
      return EMPTY_ACTIVE_SET;
    }

    return deriveActiveSet(activeId, activeKind, analysis);
  });
}
