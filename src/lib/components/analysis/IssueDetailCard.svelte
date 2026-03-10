<!--
  IssueDetailCard.svelte
  Detail card for a selected issue, showing type, confidence, label,
  related entities, and a plain-language description.
-->
<script lang="ts">
  import { getPhrase, getStatement, polarityVar, roleVar } from '$lib/components/analysis/helpers';
  import type { Issue, IssueType, ThoughtAnalysis } from '$lib/types';

  export let analysis: ThoughtAnalysis;
  export let issue: Issue;

  /** Plain-language descriptions for each issue type. */
  const ISSUE_DESCRIPTIONS: Record<IssueType, string> = {
    contradiction: 'Two elements directly oppose each other.',
    false_contrast: 'Opposition is implied, but the elements may actually align.',
    missing_bridge: 'A logical step between two elements is absent.',
    unresolved_tension: 'A conflict is present with no clear resolution path.'
  };

  interface ResolvedEntity {
    id: string;
    kind: 'phrase' | 'statement';
    label: string;
    colorVar: string;
  }

  function resolveRelatedEntities(relatedIds: string[]): ResolvedEntity[] {
    const entities: ResolvedEntity[] = [];

    for (const id of relatedIds) {
      const phrase = getPhrase(analysis, id);

      if (phrase) {
        entities.push({ id, kind: 'phrase', label: phrase.concept_label, colorVar: polarityVar(phrase.polarity) });
        continue;
      }

      const statement = getStatement(analysis, id);

      if (statement) {
        entities.push({ id, kind: 'statement', label: statement.role, colorVar: roleVar(statement.role) });
      }
    }

    return entities;
  }

  $: entities = resolveRelatedEntities(issue.related_ids);
</script>

<div class="rounded p-3" style="border: 1px solid var(--amb-border); background: var(--amb-bg);">
  <div class="mb-2 flex items-center gap-1.5">
    <span class="tag" style="background: var(--amb-tag); color: var(--amb-text); border: 1px solid var(--amb-border);">
      {issue.type.replace(/_/g, ' ')}
    </span>
    {#if issue.confidence}
      <span class="confidence">{issue.confidence}</span>
    {/if}
  </div>
  <p class="serif mt-0 mb-2 leading-relaxed" style="font-size: 13px; color: var(--text-pri);">
    {issue.label}
  </p>
  {#if entities.length > 0}
    <div class="flex flex-wrap gap-1 mb-2">
      {#each entities as entity}
        {#if entity.kind === 'phrase'}
          <span class="tag" style="background: var(--{entity.colorVar}-tag); color: var(--{entity.colorVar}-text); border: 1px solid var(--{entity.colorVar}-border);">
            {entity.label}
          </span>
        {:else}
          <span class="tag" style="background: var(--{entity.colorVar}-bg); color: var(--{entity.colorVar}-text); border: 1px solid var(--{entity.colorVar}-border);">
            {entity.label}
          </span>
        {/if}
      {/each}
    </div>
  {/if}
  <p class="desc">{ISSUE_DESCRIPTIONS[issue.type]}</p>
</div>

<style>
  .serif {
    font-family: var(--font-body);
  }

  .tag {
    display: inline-block;
    font-family: var(--font-mono);
    font-size: 9px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 1px 5px;
    border-radius: 2px;
    line-height: 16px;
    white-space: nowrap;
  }

  .confidence {
    font-family: var(--font-mono);
    font-size: 8px;
    color: var(--text-muted);
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .desc {
    margin: 0;
    font-family: var(--font-body);
    font-size: 11px;
    font-style: italic;
    color: var(--text-sec);
    line-height: 1.5;
  }
</style>
