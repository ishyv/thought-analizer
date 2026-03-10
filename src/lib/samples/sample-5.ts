import type { ThoughtAnalysis } from '$lib/types';

/** sample_5: Minimal extraction - degraded state / failure case */
export const sample_5: ThoughtAnalysis = {
  input_text: "I just don't know.",
  extraction_quality: 'minimal',
  phrase_groups: [
    {
      id: 'pg1',
      text: "don't know",
      start: 7,
      end: 17,
      concept_label: 'uncertainty state',
      confidence: 'low',
      type: 'state_context',
      polarity: 'neutral'
    }
  ],
  statement_groups: [
    {
      id: 'sg1',
      text: "I just don't know.",
      start: 0,
      end: 18,
      role: 'condition',
      phrase_ids: ['pg1']
    }
  ],
  relations: [],
  issues: [],
  summary: 'Not enough structure to analyze. The input may need more context or specificity.'
};
