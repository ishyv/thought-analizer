import type { ThoughtAnalysis } from '$lib/types';

/** sample_4: Dense multi-blocker chain - stress test for graph and insight rail */
export const sample_4: ThoughtAnalysis = {
  input_text:
    "I keep starting things I don't finish. I know what I want to build, but I don't have the time, and even when I do have time I don't feel like it, and when I feel like it I second-guess whether it's worth doing at all.",
  extraction_quality: 'full',
  phrase_groups: [
    {
      id: 'pg1',
      text: "keep starting things I don't finish",
      start: 2,
      end: 37,
      concept_label: 'incomplete pattern',
      type: 'outcome_result',
      polarity: 'negative'
    },
    {
      id: 'pg2',
      text: 'know what I want to build',
      start: 41,
      end: 66,
      concept_label: 'build intention',
      type: 'state_context',
      polarity: 'positive'
    },
    {
      id: 'pg3',
      text: "don't have the time",
      start: 75,
      end: 94,
      concept_label: 'time scarcity',
      type: 'obstacle_blocker',
      polarity: 'negative'
    },
    {
      id: 'pg4',
      text: "when I do have time I don't feel like it",
      start: 100,
      end: 140,
      concept_label: 'motivational drop',
      type: 'obstacle_blocker',
      polarity: 'negative'
    },
    {
      id: 'pg5',
      text: 'when I feel like it',
      start: 146,
      end: 165,
      concept_label: 'available window',
      type: 'state_context',
      polarity: 'neutral'
    },
    {
      id: 'pg6',
      text: "second-guess whether it's worth doing at all",
      start: 168,
      end: 212,
      concept_label: 'value doubt',
      confidence: 'medium',
      type: 'obstacle_blocker',
      polarity: 'negative'
    }
  ],
  statement_groups: [
    {
      id: 'sg1',
      text: "I keep starting things I don't finish",
      start: 0,
      end: 37,
      role: 'condition',
      phrase_ids: ['pg1']
    },
    {
      id: 'sg2',
      text: 'I know what I want to build',
      start: 39,
      end: 66,
      role: 'goal',
      phrase_ids: ['pg2']
    },
    {
      id: 'sg3',
      text: "I don't have the time",
      start: 72,
      end: 94,
      role: 'blocker',
      phrase_ids: ['pg3']
    },
    {
      id: 'sg4',
      text: "even when I do have time I don't feel like it",
      start: 100,
      end: 145,
      role: 'blocker',
      phrase_ids: ['pg4']
    },
    {
      id: 'sg5',
      text: "when I feel like it I second-guess whether it's worth doing at all",
      start: 151,
      end: 217,
      role: 'blocker',
      phrase_ids: ['pg5', 'pg6']
    }
  ],
  relations: [
    {
      id: 'r1',
      source: { kind: 'statement', id: 'sg3' },
      target: { kind: 'statement', id: 'sg2' },
      type: 'blocks'
    },
    {
      id: 'r2',
      source: { kind: 'statement', id: 'sg4' },
      target: { kind: 'statement', id: 'sg3' },
      type: 'contrasts_with'
    },
    {
      id: 'r3',
      source: { kind: 'statement', id: 'sg5' },
      target: { kind: 'statement', id: 'sg4' },
      type: 'contrasts_with'
    },
    {
      id: 'r4',
      source: { kind: 'statement', id: 'sg5' },
      target: { kind: 'statement', id: 'sg2' },
      type: 'blocks'
    }
  ],
  issues: [
    {
      id: 'i1',
      type: 'unresolved_tension',
      label:
        'Each condition that would allow progress is immediately followed by a new blocker - the chain has no exit.',
      related_ids: ['sg3', 'sg4', 'sg5'],
      confidence: 'high'
    },
    {
      id: 'i2',
      type: 'missing_bridge',
      label: 'The speaker knows what they want but no path from knowing to starting is present.',
      related_ids: ['sg2', 'sg3'],
      confidence: 'medium'
    }
  ],
  summary:
    'A goal is clearly defined but structurally inaccessible - every available condition for action is countered by an adjacent blocker.'
};
