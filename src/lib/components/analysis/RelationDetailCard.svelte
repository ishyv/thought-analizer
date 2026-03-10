<!--
  RelationDetailCard.svelte
  Detail card for a selected relation, showing type, direction, endpoints,
  and a plain-language description.
-->
<script lang="ts">
  import { getPhrase, getStatement, polarityVar, roleVar } from '$lib/components/analysis/helpers';
  import type { Relation, RelationType, ThoughtAnalysis } from '$lib/types';

  export let analysis: ThoughtAnalysis;
  export let relation: Relation;

  /** Plain-language descriptions for each relation type. */
  const RELATION_DESCRIPTIONS: Record<RelationType, string> = {
    supports: 'One element enables or strengthens the other.',
    blocks: 'One element prevents or opposes the other.',
    leads_to: 'One element causes or follows into the other.',
    contrasts_with: 'Two elements are framed in opposition.'
  };

  function relColorVar(type: RelationType): string {
    return `--rel-${type.replace(/_/g, '-')}`;
  }

  function resolveNodeLabel(kind: 'phrase' | 'statement', id: string): string {
    if (kind === 'phrase') {
      const phrase = getPhrase(analysis, id);
      return phrase ? phrase.concept_label : id;
    }
    const statement = getStatement(analysis, id);
    return statement ? statement.text.slice(0, 40) : id;
  }

  $: color = relColorVar(relation.type);
  $: srcStmt = relation.source.kind === 'statement' ? getStatement(analysis, relation.source.id) : undefined;
  $: srcPhrase = relation.source.kind === 'phrase' ? getPhrase(analysis, relation.source.id) : undefined;
  $: tgtStmt = relation.target.kind === 'statement' ? getStatement(analysis, relation.target.id) : undefined;
  $: tgtPhrase = relation.target.kind === 'phrase' ? getPhrase(analysis, relation.target.id) : undefined;
</script>

<div class="rounded p-3" style="border: 1px solid var({color}); background: rgba(0,0,0,0.2);">
  <span class="tag" style="color: var({color}); border: 1px solid var({color}); background: transparent;">
    {relation.type.replace(/_/g, ' ')}
  </span>
  <p class="serif mt-2 mb-2 leading-relaxed" style="font-size: 13px; color: var(--text-pri);">
    <span>{resolveNodeLabel(relation.source.kind, relation.source.id)}</span>
    <span style="color: var({color}); margin: 0 0.3em;">→</span>
    <span>{resolveNodeLabel(relation.target.kind, relation.target.id)}</span>
  </p>
  <div class="flex gap-1.5 mb-2">
    {#if srcStmt}
      {@const srcRole = roleVar(srcStmt.role)}
      <span class="tag" style="background: var(--{srcRole}-bg); color: var(--{srcRole}-text); border: 1px solid var(--{srcRole}-border);">
        {srcStmt.role}
      </span>
    {:else if srcPhrase}
      {@const srcPol = polarityVar(srcPhrase.polarity)}
      <span class="tag" style="background: var(--{srcPol}-tag); color: var(--{srcPol}-text); border: 1px solid var(--{srcPol}-border);">
        {srcPhrase.type.replace(/_/g, ' ')}
      </span>
    {/if}
    {#if tgtStmt}
      {@const tgtRole = roleVar(tgtStmt.role)}
      <span class="tag" style="background: var(--{tgtRole}-bg); color: var(--{tgtRole}-text); border: 1px solid var(--{tgtRole}-border);">
        {tgtStmt.role}
      </span>
    {:else if tgtPhrase}
      {@const tgtPol = polarityVar(tgtPhrase.polarity)}
      <span class="tag" style="background: var(--{tgtPol}-tag); color: var(--{tgtPol}-text); border: 1px solid var(--{tgtPol}-border);">
        {tgtPhrase.type.replace(/_/g, ' ')}
      </span>
    {/if}
  </div>
  <p class="desc">{RELATION_DESCRIPTIONS[relation.type]}</p>
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

  .desc {
    margin: 0;
    font-family: var(--font-body);
    font-size: 11px;
    font-style: italic;
    color: var(--text-sec);
    line-height: 1.5;
  }
</style>
