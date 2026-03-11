<!--
  AnalysisDerivedInsights.svelte
  Renders heuristically derived insights (unresolved needs and hidden
  assumptions) that are not directly present in the LLM output.
-->
<script lang="ts">
  import { hiddenAssumptions, unresolvedNeeds } from '$lib/derive';
  import type { Issue, ThoughtAnalysis } from '$lib/types';

  export let analysis: ThoughtAnalysis;
  export let mainTensionId: string | null;

  $: needs = unresolvedNeeds(analysis);
  $: assumptions = hiddenAssumptions(analysis, mainTensionId);
</script>

{#if needs.length > 0}
  <div class="insight-section">
    <div class="section-header">
      <span class="section-label">unresolved need</span>
      <div class="section-rule"></div>
    </div>
    <div class="chips">
      {#each needs.slice(0, 2) as need}
        <span class="need-chip">
          {need.concept_label}
        </span>
      {/each}
      {#if needs.length > 2}
        <span class="more-note">+{needs.length - 2} more</span>
      {/if}
    </div>
  </div>
{/if}

{#if assumptions.length > 0}
  <div class="insight-section">
    <div class="section-header">
      <span class="section-label">possible assumption</span>
      <div class="section-rule"></div>
    </div>
    <p class="assumption-text">
      {assumptions[0].label}
    </p>
    {#if assumptions.length > 1}
      <span class="more-note">+{assumptions.length - 1} more</span>
    {/if}
  </div>
{/if}

<style>
  .insight-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .section-label {
    font-family: var(--font-mono);
    font-size: 9px;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--text-sec);
    flex-shrink: 0;
  }

  .section-rule {
    flex: 1;
    height: 1px;
    background: var(--border);
  }

  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
  }

  .need-chip {
    display: inline-block;
    font-family: var(--font-mono);
    font-size: 9px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 2px 6px;
    border-radius: 2px;
    line-height: 16px;
    white-space: nowrap;
    background: var(--neg-tag);
    color: var(--neg-text);
    border: 1px solid var(--neg-border);
  }

  .assumption-text {
    margin: 0;
    font-family: var(--font-body);
    font-size: 12px;
    line-height: 1.6;
    color: var(--text-sec);
    opacity: 0.75;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }

  .more-note {
    display: inline-block;
    font-family: var(--font-mono);
    font-size: 8px;
    color: var(--text-muted);
    letter-spacing: 0.1em;
  }
</style>
