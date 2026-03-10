/**
 * Pure active-set derivation logic.
 *
 * Maps a hovered or selected entity id to the full set of related phrases,
 * statements, relations, and issues that should light up across the analysis UI.
 *
 * Invariants:
 * - Unknown ids never throw; they degrade to a smaller active set.
 * - Only ids explicitly present in the current `ThoughtAnalysis` are surfaced.
 *
 * Limits:
 * - This file knows nothing about Svelte stores.
 * - It assumes phrase spans and relation ids were already validated upstream.
 */

import type { ThoughtAnalysis } from '$lib/core/thought-analysis/model';
import type { ActiveSet, SelectableKind } from '$lib/core/thought-analysis/selection';

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
      phraseIds.add(activeId);

      for (const statement of analysis.statement_groups) {
        if (statement.phrase_ids.includes(activeId)) {
          statementIds.add(statement.id);
        }
      }

      for (const relation of analysis.relations) {
        const srcMatch = relation.source.kind === 'phrase' && relation.source.id === activeId;
        const tgtMatch = relation.target.kind === 'phrase' && relation.target.id === activeId;

        if (srcMatch || tgtMatch) {
          relationIds.add(relation.id);

          if (relation.source.kind === 'phrase') phraseIds.add(relation.source.id);
          if (relation.target.kind === 'phrase') phraseIds.add(relation.target.id);
          if (relation.source.kind === 'statement') statementIds.add(relation.source.id);
          if (relation.target.kind === 'statement') statementIds.add(relation.target.id);
        }
      }

      for (const issue of analysis.issues) {
        if (issue.related_ids.includes(activeId)) {
          issueIds.add(issue.id);
        }
      }

      break;
    }

    case 'statement': {
      statementIds.add(activeId);

      const statement = analysis.statement_groups.find((entry) => entry.id === activeId);
      if (statement) {
        for (const phraseId of statement.phrase_ids) {
          phraseIds.add(phraseId);
        }
      }

      for (const relation of analysis.relations) {
        const srcMatch = relation.source.kind === 'statement' && relation.source.id === activeId;
        const tgtMatch = relation.target.kind === 'statement' && relation.target.id === activeId;

        if (srcMatch || tgtMatch) {
          relationIds.add(relation.id);

          if (relation.source.kind === 'statement') statementIds.add(relation.source.id);
          if (relation.target.kind === 'statement') statementIds.add(relation.target.id);
          if (relation.source.kind === 'phrase') phraseIds.add(relation.source.id);
          if (relation.target.kind === 'phrase') phraseIds.add(relation.target.id);
        }
      }

      for (const issue of analysis.issues) {
        if (issue.related_ids.includes(activeId)) {
          issueIds.add(issue.id);
        }
      }

      break;
    }

    case 'relation': {
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
