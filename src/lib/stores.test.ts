import { get } from 'svelte/store';
import { beforeEach, describe, expect, it } from 'vitest';

import type { ThoughtAnalysis } from '$lib/core/thought-analysis/model';
import { EMPTY_SELECTION_STATE } from '$lib/core/thought-analysis/selection';
import { createActiveSetStore, selection, selectionState } from '$lib/stores';

const analysis: ThoughtAnalysis = {
  input_text: 'Need blocked by fatigue.',
  extraction_quality: 'full',
  phrase_groups: [
    {
      id: 'pg1',
      text: 'Need',
      start: 0,
      end: 4,
      concept_label: 'need',
      type: 'need_desire',
      polarity: 'negative'
    }
  ],
  statement_groups: [
    {
      id: 'sg1',
      text: 'Need blocked by fatigue',
      start: 0,
      end: 22,
      role: 'blocker',
      phrase_ids: ['pg1']
    }
  ],
  relations: [],
  issues: [],
  summary: 'A need is blocked.'
};

describe('createActiveSetStore', () => {
  beforeEach(() => {
    selectionState.set({ ...EMPTY_SELECTION_STATE });
  });

  it('prefers the selected entity over the hovered entity', () => {
    const activeSetStore = createActiveSetStore(analysis);

    selection.hover('pg1', 'phrase');
    selection.select('sg1', 'statement');

    const activeSet = get(activeSetStore);

    expect(activeSet.statementIds).toEqual(new Set(['sg1']));
    expect(activeSet.phraseIds).toEqual(new Set(['pg1']));
  });

  it('returns the empty active set when nothing is hovered or selected', () => {
    const activeSetStore = createActiveSetStore(analysis);

    expect(get(activeSetStore)).toEqual({
      phraseIds: new Set(),
      statementIds: new Set(),
      relationIds: new Set(),
      issueIds: new Set()
    });
  });
});
