<!--
  FilterBar.svelte
  Compact filter bar for the insight rail. Only visible when phrase group
  count exceeds 3. Allows filtering by polarity, phrase type, and issue type.
-->
<script lang="ts">
  import {
    ALLOWED_ISSUE_TYPES,
    ALLOWED_PHRASE_TYPES,
    ALLOWED_POLARITIES
  } from '$lib/analysis/config';
  import { filter, filterState, type FilterState } from '$lib/stores';
  import type { IssueType, PhraseType, Polarity, ThoughtAnalysis } from '$lib/types';

  export let analysis: ThoughtAnalysis;

  $: visible = analysis.phrase_groups.length > 3;
  $: hasActiveFilter =
    $filterState.polarities.size > 0 ||
    $filterState.phraseTypes.size > 0 ||
    $filterState.issueTypes.size > 0;

  function isPolarityActive(p: Polarity, state: FilterState): boolean {
    return state.polarities.size === 0 || state.polarities.has(p);
  }

  function isPhraseTypeActive(t: PhraseType, state: FilterState): boolean {
    return state.phraseTypes.size === 0 || state.phraseTypes.has(t);
  }

  function isIssueTypeActive(t: IssueType, state: FilterState): boolean {
    return state.issueTypes.size === 0 || state.issueTypes.has(t);
  }
</script>

{#if visible}
  <div class="filter-bar">
    <div class="filter-row">
      <span class="filter-label">polarity</span>
      <div class="chip-row">
        {#each ALLOWED_POLARITIES as p}
          <button
            type="button"
            class="chip"
            class:active={$filterState.polarities.has(p)}
            class:dimmed={!isPolarityActive(p, $filterState)}
            onclick={() => filter.togglePolarity(p)}
          >
            {p}
          </button>
        {/each}
      </div>
    </div>

    <div class="filter-row">
      <span class="filter-label">phrase</span>
      <div class="chip-row">
        {#each ALLOWED_PHRASE_TYPES as t}
          <button
            type="button"
            class="chip"
            class:active={$filterState.phraseTypes.has(t)}
            class:dimmed={!isPhraseTypeActive(t, $filterState)}
            onclick={() => filter.togglePhraseType(t)}
          >
            {t.replace(/_/g, ' ')}
          </button>
        {/each}
      </div>
    </div>

    <div class="filter-row">
      <span class="filter-label">issue</span>
      <div class="chip-row">
        {#each ALLOWED_ISSUE_TYPES as t}
          <button
            type="button"
            class="chip"
            class:active={$filterState.issueTypes.has(t)}
            class:dimmed={!isIssueTypeActive(t, $filterState)}
            onclick={() => filter.toggleIssueType(t)}
          >
            {t.replace(/_/g, ' ')}
          </button>
        {/each}
      </div>
    </div>

    {#if hasActiveFilter}
      <button type="button" class="clear-link" onclick={() => filter.clearAll()}>
        clear filters
      </button>
    {/if}
  </div>
{/if}

<style>
  .filter-bar {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .filter-row {
    display: flex;
    align-items: baseline;
    gap: 6px;
    flex-wrap: wrap;
  }

  .filter-label {
    font-family: var(--font-mono);
    font-size: 8px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text-muted);
    flex: none;
    min-width: 44px;
  }

  .chip-row {
    display: flex;
    flex-wrap: wrap;
    gap: 3px;
  }

  .chip {
    font-family: var(--font-mono);
    font-size: 8px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    padding: 1px 4px;
    border-radius: 2px;
    line-height: 14px;
    white-space: nowrap;
    cursor: pointer;
    border: 1px solid var(--border);
    background: transparent;
    color: var(--text-sec);
    transition:
      background var(--transition-fast),
      border-color var(--transition-fast),
      color var(--transition-fast),
      opacity var(--transition-fast);
  }

  .chip.active {
    background: var(--pos-tag);
    border-color: var(--pos-border);
    color: var(--pos-text);
  }

  .chip.dimmed {
    opacity: 0.4;
  }

  .chip:hover {
    border-color: var(--border-hi);
  }

  .clear-link {
    font-family: var(--font-mono);
    font-size: 8px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-muted);
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 0;
    align-self: flex-start;
    transition: color var(--transition-fast);
  }

  .clear-link:hover {
    color: var(--text-sec);
  }
</style>
