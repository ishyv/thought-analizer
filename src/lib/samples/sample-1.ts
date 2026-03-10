import type { ThoughtAnalysis } from '$lib/types';

/** sample_1: Clean dual-blocker tension - happy path */
export const sample_1: ThoughtAnalysis = {
  input_text:
    'I want to make a useful project, but everything useful feels boring, and everything cool feels too vague or too hard to finish.',
  extraction_quality: 'full',
  phrase_groups: [
    {
      id: 'pg1',
      text: 'want to make a useful project',
      start: 2,
      end: 31,
      concept_label: 'project goal',
      type: 'need_desire',
      polarity: 'positive'
    },
    {
      id: 'pg2',
      text: 'everything useful feels boring',
      start: 37,
      end: 67,
      concept_label: 'boredom filter',
      type: 'obstacle_blocker',
      polarity: 'negative'
    },
    {
      id: 'pg3',
      text: 'everything cool feels too vague',
      start: 73,
      end: 104,
      concept_label: 'vagueness barrier',
      type: 'obstacle_blocker',
      polarity: 'negative'
    },
    {
      id: 'pg4',
      text: 'too hard to finish',
      start: 108,
      end: 126,
      concept_label: 'completion cost',
      type: 'obstacle_blocker',
      polarity: 'negative'
    }
  ],
  statement_groups: [
    {
      id: 'sg1',
      text: 'I want to make a useful project',
      start: 0,
      end: 31,
      role: 'goal',
      phrase_ids: ['pg1']
    },
    {
      id: 'sg2',
      text: 'everything useful feels boring',
      start: 37,
      end: 67,
      role: 'blocker',
      phrase_ids: ['pg2']
    },
    {
      id: 'sg3',
      text: 'everything cool feels too vague or too hard to finish',
      start: 73,
      end: 126,
      role: 'blocker',
      phrase_ids: ['pg3', 'pg4']
    }
  ],
  relations: [
    {
      id: 'r1',
      source: { kind: 'statement', id: 'sg2' },
      target: { kind: 'statement', id: 'sg1' },
      type: 'blocks'
    },
    {
      id: 'r2',
      source: { kind: 'statement', id: 'sg3' },
      target: { kind: 'statement', id: 'sg1' },
      type: 'blocks'
    },
    {
      id: 'r3',
      source: { kind: 'phrase', id: 'pg3' },
      target: { kind: 'phrase', id: 'pg4' },
      type: 'leads_to'
    }
  ],
  issues: [
    {
      id: 'i1',
      type: 'unresolved_tension',
      label:
        'Usefulness and excitement are framed as mutually exclusive, with no third path present.',
      related_ids: ['sg1', 'sg2', 'sg3'],
      confidence: 'high'
    }
  ],
  summary:
    'A creative goal is blocked by two competing judgments that make both practical and exciting options feel unavailable.'
};
