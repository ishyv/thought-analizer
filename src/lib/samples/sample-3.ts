import type { ThoughtAnalysis } from '$lib/types';

/** sample_3: False contrast / self-imposed constraint */
export const sample_3: ThoughtAnalysis = {
  input_text: "I want the portfolio to feel playful, but I also don't want it to look unserious.",
  extraction_quality: 'full',
  phrase_groups: [
    {
      id: 'pg1',
      text: 'feel playful',
      start: 24,
      end: 36,
      concept_label: 'playful tone',
      type: 'need_desire',
      polarity: 'positive'
    },
    {
      id: 'pg2',
      text: "don't want it to look unserious",
      start: 48,
      end: 79,
      concept_label: 'seriousness constraint',
      confidence: 'high',
      type: 'obstacle_blocker',
      polarity: 'negative'
    }
  ],
  statement_groups: [
    {
      id: 'sg1',
      text: 'I want the portfolio to feel playful',
      start: 0,
      end: 36,
      role: 'goal',
      phrase_ids: ['pg1']
    },
    {
      id: 'sg2',
      text: "I don't want it to look unserious",
      start: 43,
      end: 79,
      role: 'condition',
      phrase_ids: ['pg2']
    }
  ],
  relations: [
    {
      id: 'r1',
      source: { kind: 'statement', id: 'sg2' },
      target: { kind: 'statement', id: 'sg1' },
      type: 'contrasts_with'
    }
  ],
  issues: [
    {
      id: 'i1',
      type: 'false_contrast',
      label:
        'Playful and serious are treated as opposites - but they can coexist. The constraint may be self-imposed.',
      related_ids: ['sg1', 'sg2'],
      confidence: 'high'
    }
  ],
  summary:
    'A design preference is constrained by a framing that treats two compatible qualities as mutually exclusive.'
};
