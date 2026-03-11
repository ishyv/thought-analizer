<!--
  AnalysisSelectionDetail.svelte
  Detail card shown in the insight rail when a phrase, statement, relation,
  or issue is selected. Dispatches to the appropriate card component.
-->
<script lang="ts">
  import { getStatementPhrases, polarityVar, roleVar } from '$lib/components/analysis/helpers';
  import type { Issue, PhraseGroup, Relation, StatementGroup, ThoughtAnalysis } from '$lib/types';

  import IssueDetailCard from '$lib/components/analysis/IssueDetailCard.svelte';
  import RelationDetailCard from '$lib/components/analysis/RelationDetailCard.svelte';

  export let analysis: ThoughtAnalysis;
  export let selectedStatement: StatementGroup | undefined;
  export let selectedPhrase: PhraseGroup | undefined;
  export let selectedRelation: Relation | undefined;
  export let selectedIssue: Issue | undefined;
</script>

{#if selectedStatement}
  {@const role = roleVar(selectedStatement.role)}
  {@const phrases = getStatementPhrases(analysis, selectedStatement)}
  <div class="rounded p-3" style="border: 1px solid var(--{role}-border); background: var(--{role}-bg);">
    <p class="serif mt-1 mb-2.5 leading-relaxed" style="font-size: 13px; color: var(--text-pri); word-wrap: break-word; overflow-wrap: break-word;">
      "{selectedStatement.text}"
    </p>

    <details class="advanced-data">
      <summary class="advanced-summary">show metadata</summary>
      <div class="advanced-content flex flex-col gap-2 mt-2">
        <div>
          <span
            class="tag"
            style="background: var(--{role}-bg); color: var(--{role}-text); border: 1px solid var(--{role}-border);"
          >
            {selectedStatement.role}
          </span>
        </div>
        <div class="flex flex-wrap gap-1">
          {#each phrases as phrase}
            {@const polarity = polarityVar(phrase.polarity)}
            <span
              class="tag"
              style="background: var(--{polarity}-tag); color: var(--{polarity}-text); border: 1px solid var(--{polarity}-border);"
            >
              {phrase.concept_label}
            </span>
          {/each}
        </div>
      </div>
    </details>
  </div>
{:else if selectedPhrase}
  {@const polarity = polarityVar(selectedPhrase.polarity)}
  <div class="rounded p-3" style="border: 1px solid var(--{polarity}-border); background: var(--{polarity}-bg);">
    <p class="serif m-0 mb-3 leading-relaxed" style="font-size: 13px; color: var(--text-pri); word-wrap: break-word; overflow-wrap: break-word;">
      "{selectedPhrase.text}"
    </p>

    <details class="advanced-data">
      <summary class="advanced-summary">show metadata</summary>
      <div class="advanced-content flex gap-1.5 mt-2">
        <span
          class="tag"
          style="background: var(--{polarity}-tag); color: var(--{polarity}-text); border: 1px solid var(--{polarity}-border);"
        >
          {selectedPhrase.concept_label}
        </span>
        <span
          class="tag"
          style="background: var(--{polarity}-tag); color: var(--{polarity}-text); border: 1px solid var(--{polarity}-border);"
        >
          {selectedPhrase.polarity}
        </span>
      </div>
    </details>
  </div>
{:else if selectedRelation}
  <RelationDetailCard {analysis} relation={selectedRelation} />
{:else if selectedIssue}
  <IssueDetailCard {analysis} issue={selectedIssue} />
{/if}

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

  .advanced-data {
    margin-top: 0.5rem;
  }

  .advanced-summary {
    font-family: var(--font-mono);
    font-size: 9px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-muted);
    cursor: pointer;
    user-select: none;
    opacity: 0.8;
  }
  
  .advanced-summary:hover {
    color: var(--text-pri);
    opacity: 1;
  }
</style>
