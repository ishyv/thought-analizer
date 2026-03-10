/**
 * Pure active-set derivation logic.
 *
 * Given a selection state and a ThoughtAnalysis, computes the full set of
 * entity ids that should be highlighted across all panels. No Svelte
 * dependencies — this is a pure function suitable for testing.
 */

import type { ThoughtAnalysis } from '$lib/types';

import type { ActiveSet, SelectableKind } from '$lib/stores';

/** Empty baseline returned when no entity is hovered or selected. */
export const EMPTY_ACTIVE_SET: ActiveSet = {
  phraseIds: new Set(),
  statementIds: new Set(),
  relationIds: new Set(),
  issueIds: new Set()
};

/**
 * Derives the full highlight set for a given active entity.
 *
 * @param activeId The id of the currently hovered or selected entity.
 * @param activeKind The kind of the currently active entity.
 * @param analysis The validated analysis driving the current view.
 * @returns Expanded sets of phrase, statement, relation, and issue ids.
 */
export function deriveActiveSet(
  activeId: string,
  activeKind: SelectableKind,
  analysis: ThoughtAnalysis
): ActiveSet {
  const phraseIds = new Set<string>();
  const statementIds = new Set<string>();
  const relationIds = new Set<string>();
  const issueIds = new Set<string>();

  switch (activeKind) {
    case 'phrase': {
      // Activate the hovered phrase itself as the root of the highlight set.
      phraseIds.add(activeId);

      for (const statement of analysis.statement_groups) {
        if (statement.phrase_ids.includes(activeId)) {
          // Activate parent statements so the graph highlights the containing clause.
          statementIds.add(statement.id);
        }
      }

      for (const relation of analysis.relations) {
        const srcMatch = relation.source.kind === 'phrase' && relation.source.id === activeId;
        const tgtMatch = relation.target.kind === 'phrase' && relation.target.id === activeId;

        if (srcMatch || tgtMatch) {
          // Activate directly connected relations and whichever endpoints they touch.
          relationIds.add(relation.id);

          if (relation.source.kind === 'phrase') phraseIds.add(relation.source.id);
          if (relation.target.kind === 'phrase') phraseIds.add(relation.target.id);
          if (relation.source.kind === 'statement') statementIds.add(relation.source.id);
          if (relation.target.kind === 'statement') statementIds.add(relation.target.id);
        }
      }

      for (const issue of analysis.issues) {
        if (issue.related_ids.includes(activeId)) {
          // Activate issues that explicitly reference the active phrase.
          issueIds.add(issue.id);
        }
      }

      break;
    }

    case 'statement': {
      // Activate the selected statement as the center of the current clause view.
      statementIds.add(activeId);

      const statement = analysis.statement_groups.find((entry) => entry.id === activeId);
      if (statement) {
        for (const phraseId of statement.phrase_ids) {
          // Activate contained phrases so the text panel mirrors the graph focus.
          phraseIds.add(phraseId);
        }
      }

      for (const relation of analysis.relations) {
        const srcMatch = relation.source.kind === 'statement' && relation.source.id === activeId;
        const tgtMatch = relation.target.kind === 'statement' && relation.target.id === activeId;

        if (srcMatch || tgtMatch) {
          // Activate connected relations and all their endpoints for local context.
          relationIds.add(relation.id);

          if (relation.source.kind === 'statement') statementIds.add(relation.source.id);
          if (relation.target.kind === 'statement') statementIds.add(relation.target.id);
          if (relation.source.kind === 'phrase') phraseIds.add(relation.source.id);
          if (relation.target.kind === 'phrase') phraseIds.add(relation.target.id);
        }
      }

      for (const issue of analysis.issues) {
        if (issue.related_ids.includes(activeId)) {
          // Activate issues that cite the selected statement as evidence.
          issueIds.add(issue.id);
        }
      }

      break;
    }

    case 'relation': {
      // Activate the chosen relation and the nodes it connects.
      relationIds.add(activeId);
      const relation = analysis.relations.find((entry) => entry.id === activeId);

      if (relation) {
        if (relation.source.kind === 'phrase') phraseIds.add(relation.source.id);
        if (relation.source.kind === 'statement') statementIds.add(relation.source.id);
        if (relation.target.kind === 'phrase') phraseIds.add(relation.target.id);
        if (relation.target.kind === 'statement') statementIds.add(relation.target.id);
      }

      break;
    }

    case 'issue': {
      // Activate the chosen issue and every phrase or statement it references.
      issueIds.add(activeId);
      const issue = analysis.issues.find((entry) => entry.id === activeId);

      if (issue) {
        for (const relatedId of issue.related_ids) {
          if (analysis.phrase_groups.some((phrase) => phrase.id === relatedId)) {
            phraseIds.add(relatedId);
          }

          if (analysis.statement_groups.some((statement) => statement.id === relatedId)) {
            statementIds.add(relatedId);
          }
        }
      }

      break;
    }
  }

  return { phraseIds, statementIds, relationIds, issueIds };
}
