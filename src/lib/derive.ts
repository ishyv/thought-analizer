import type { Issue, PhraseGroup, StatementRole, ThoughtAnalysis } from '$lib/types';

/**
 * Pure derivation utilities.
 * Computes higher-order insights from a ThoughtAnalysis without calling the LLM.
 * Used by the insight rail.
 */

const ROLE_LABELS: Record<StatementRole, string> = {
  goal: 'goal-driven',
  condition: 'context-heavy',
  blocker: 'mostly blocked',
  action: 'action-oriented',
  outcome: 'outcome-focused'
} as const;

const ISSUE_PRIORITY: Record<'high' | 'medium' | 'low', number> = {
  high: 3,
  medium: 2,
  low: 1
};

/**
 * Finds the most dominant statement-role pattern in an analysis.
 *
 * @param analysis Validated analysis to summarize heuristically.
 * @returns A short readable pattern label, or "Mixed structure" when tied.
 */
export function dominantPattern(analysis: ThoughtAnalysis): string {
  if (analysis.statement_groups.length === 0) {
    return 'Mixed structure';
  }

  const counts = new Map<StatementRole, number>();

  for (const statement of analysis.statement_groups) {
    counts.set(statement.role, (counts.get(statement.role) ?? 0) + 1);
  }

  const ordered = [...counts.entries()].sort((left, right) => right[1] - left[1]);
  const [, highestCount] = ordered[0];
  const tied = ordered.filter((entry) => entry[1] === highestCount);

  if (tied.length !== 1) {
    return 'Mixed structure';
  }

  return ROLE_LABELS[tied[0][0]];
}

/**
 * Picks the primary issue to feature in the insight rail.
 *
 * @param analysis Validated analysis to inspect for ranked issues.
 * @returns The highest-confidence issue, the first issue, or null when absent.
 */
export function mainTension(analysis: ThoughtAnalysis): Issue | null {
  if (analysis.issues.length === 0) {
    return null;
  }

  return analysis.issues.reduce<Issue>((best, issue) => {
    const bestScore = best.confidence ? ISSUE_PRIORITY[best.confidence] : 0;
    const issueScore = issue.confidence ? ISSUE_PRIORITY[issue.confidence] : 0;

    return issueScore > bestScore ? issue : best;
  }, analysis.issues[0]);
}

/**
 * Returns phrase groups that represent unmet needs: phrases with type
 * `need_desire` and polarity `negative` that have no outgoing `leads_to`
 * relation.
 *
 * An empty array means all needs are connected to outcomes.
 *
 * @param analysis Validated analysis to inspect.
 * @returns Phrase groups representing unresolved needs.
 */
export function unresolvedNeeds(analysis: ThoughtAnalysis): PhraseGroup[] {
  const negativeNeeds = analysis.phrase_groups.filter(
    (pg) => pg.type === 'need_desire' && pg.polarity === 'negative'
  );

  return negativeNeeds.filter((pg) => {
    const hasLeadsTo = analysis.relations.some(
      (r) => r.source.kind === 'phrase' && r.source.id === pg.id && r.type === 'leads_to'
    );
    return !hasLeadsTo;
  });
}

/**
 * Returns issues of type `missing_bridge` that are not already surfaced
 * as the main tension.
 *
 * These represent secondary assumptions that may be worth surfacing without
 * dominating the insight rail.
 *
 * @param analysis Validated analysis to inspect.
 * @param mainTensionId Id of the issue already shown as main tension, or null.
 * @returns Issues representing possible hidden assumptions.
 */
export function hiddenAssumptions(
  analysis: ThoughtAnalysis,
  mainTensionId: string | null
): Issue[] {
  return analysis.issues.filter(
    (issue) => issue.type === 'missing_bridge' && issue.id !== mainTensionId
  );
}
