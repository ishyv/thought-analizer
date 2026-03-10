import type { ThoughtAnalysis } from '$lib/types';

/** sample_2: Emotional inaction loop - recommended for UI development */
export const sample_2: ThoughtAnalysis = {
  input_text:
    "I was hungry, but I didn't want to eat anything. I was too tired to get out of bed, so I stayed there even though I was still hungry.",
  extraction_quality: 'full',
  phrase_groups: [
    {
      id: 'pg1',
      text: 'hungry',
      start: 7,
      end: 13,
      concept_label: 'unmet need',
      confidence: 'high',
      type: 'need_desire',
      polarity: 'negative'
    },
    {
      id: 'pg2',
      text: "didn't want to eat anything",
      start: 22,
      end: 49,
      concept_label: 'eating aversion',
      confidence: 'medium',
      type: 'obstacle_blocker',
      polarity: 'negative'
    },
    {
      id: 'pg3',
      text: 'too tired to get out of bed',
      start: 54,
      end: 81,
      concept_label: 'exhaustion barrier',
      type: 'obstacle_blocker',
      polarity: 'negative'
    },
    {
      id: 'pg4',
      text: 'stayed there',
      start: 86,
      end: 98,
      concept_label: 'inaction outcome',
      type: 'outcome_result',
      polarity: 'neutral'
    },
    {
      id: 'pg5',
      text: 'still hungry',
      start: 120,
      end: 132,
      concept_label: 'persistent hunger',
      type: 'outcome_result',
      polarity: 'negative'
    }
  ],
  statement_groups: [
    { id: 'sg1', text: 'I was hungry', start: 0, end: 13, role: 'condition', phrase_ids: ['pg1'] },
    {
      id: 'sg2',
      text: "I didn't want to eat anything",
      start: 19,
      end: 49,
      role: 'blocker',
      phrase_ids: ['pg2']
    },
    {
      id: 'sg3',
      text: 'I was too tired to get out of bed',
      start: 50,
      end: 83,
      role: 'blocker',
      phrase_ids: ['pg3']
    },
    {
      id: 'sg4',
      text: 'I stayed there even though I was still hungry',
      start: 88,
      end: 133,
      role: 'outcome',
      phrase_ids: ['pg4', 'pg5']
    }
  ],
  relations: [
    {
      id: 'r1',
      source: { kind: 'statement', id: 'sg2' },
      target: { kind: 'statement', id: 'sg1' },
      type: 'contrasts_with'
    },
    {
      id: 'r2',
      source: { kind: 'statement', id: 'sg3' },
      target: { kind: 'statement', id: 'sg2' },
      type: 'supports'
    },
    {
      id: 'r3',
      source: { kind: 'statement', id: 'sg3' },
      target: { kind: 'statement', id: 'sg4' },
      type: 'leads_to'
    },
    {
      id: 'r4',
      source: { kind: 'statement', id: 'sg4' },
      target: { kind: 'statement', id: 'sg1' },
      type: 'contrasts_with'
    }
  ],
  issues: [
    {
      id: 'i1',
      type: 'unresolved_tension',
      label:
        'A basic need persists unmet at the end - the outcome restates the original condition without resolving it.',
      related_ids: ['sg1', 'sg4'],
      confidence: 'high'
    }
  ],
  summary:
    'A physical need remains unmet because exhaustion raises the cost of action beyond what the speaker can currently pay.'
};
