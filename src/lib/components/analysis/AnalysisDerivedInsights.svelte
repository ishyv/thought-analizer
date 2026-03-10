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
  <div>
    <div class="divider-row mb-3">
      <span class="divider-label">unresolved need</span>
      <div class="divider-line"></div>
    </div>
    <div class="flex flex-wrap gap-1">
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
  <div>
    <div class="divider-row mb-3">
      <span class="divider-label">possible assumption</span>
      <div class="divider-line"></div>
    </div>
    <p class="serif m-0 leading-relaxed" style="font-size: 12px; color: var(--text-sec); opacity: 0.75;">
      {assumptions[0].label}
    </p>
    {#if assumptions.length > 1}
      <span class="more-note mt-1">+{assumptions.length - 1} more</span>
    {/if}
  </div>
{/if}

<style>
  .serif {
    font-family: var(--font-body);
  }

  .divider-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .divider-line {
    flex: 1;
    height: 1px;
    background: var(--border);
  }

  .divider-label {
    font-family: var(--font-mono);
    font-size: 9px;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--text-sec);
  }

  .need-chip {
    display: inline-block;
    font-family: var(--font-mono);
    font-size: 9px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 1px 5px;
    border-radius: 2px;
    line-height: 16px;
    white-space: nowrap;
    background: var(--neg-tag);
    color: var(--neg-text);
    border: 1px solid var(--neg-border);
  }

  .more-note {
    display: inline-block;
    font-family: var(--font-mono);
    font-size: 8px;
    color: var(--text-muted);
    letter-spacing: 0.1em;
  }
</style>
