import { describe, expect, it } from 'vitest';

import { deriveActiveSet } from '$lib/core/thought-analysis/derive-active-set';
import type { ThoughtAnalysis } from '$lib/core/thought-analysis/model';

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
    },
    {
      id: 'pg2',
      text: 'fatigue',
      start: 15,
      end: 22,
      concept_label: 'fatigue',
      type: 'obstacle_blocker',
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
      phrase_ids: ['pg1', 'pg2']
    },
    {
      id: 'sg2',
      text: 'No action follows',
      start: 0,
      end: 0,
      role: 'outcome',
      phrase_ids: []
    }
  ],
  relations: [
    {
      id: 'r1',
      source: { kind: 'phrase', id: 'pg1' },
      target: { kind: 'statement', id: 'sg1' },
      type: 'blocks'
    },
    {
      id: 'r2',
      source: { kind: 'statement', id: 'sg1' },
      target: { kind: 'statement', id: 'sg2' },
      type: 'leads_to'
    }
  ],
  issues: [
    {
      id: 'i1',
      type: 'unresolved_tension',
      label: 'Need remains unresolved.',
      related_ids: ['pg1', 'sg1']
    }
  ],
  summary: 'A need is blocked and stays unresolved.'
};

describe('deriveActiveSet', () => {
  it('expands phrase selection to related statements, relations, and issues', () => {
    const activeSet = deriveActiveSet('pg1', 'phrase', analysis);

    expect(activeSet.phraseIds).toEqual(new Set(['pg1']));
    expect(activeSet.statementIds).toEqual(new Set(['sg1']));
    expect(activeSet.relationIds).toEqual(new Set(['r1']));
    expect(activeSet.issueIds).toEqual(new Set(['i1']));
  });

  it('expands statement selection to contained phrases and connected statements', () => {
    const activeSet = deriveActiveSet('sg1', 'statement', analysis);

    expect(activeSet.phraseIds).toEqual(new Set(['pg1', 'pg2']));
    expect(activeSet.statementIds).toEqual(new Set(['sg1', 'sg2']));
    expect(activeSet.relationIds).toEqual(new Set(['r1', 'r2']));
    expect(activeSet.issueIds).toEqual(new Set(['i1']));
  });
});
