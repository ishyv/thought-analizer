<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  import type { ThoughtAnalysis } from '$lib/types';

  export let analysis: ThoughtAnalysis;
  export let showResetAction = false;

  const dispatch = createEventDispatcher<{ reset: void }>();

  function handleReset(): void {
    dispatch('reset');
  }
</script>

<header class="top-bar flex items-center gap-4 px-8 py-3.5">
  <span class="mono text-xs tracking-widest uppercase" style="color: var(--text-pri);">
    thought structure
  </span>
  <div class="h-3.5 w-px" style="background: var(--border);"></div>
  <span class="mono" style="font-size: 9px; letter-spacing: 0.15em; color: var(--text-sec);">
    analysis view
  </span>
  <div class="flex-1"></div>

  {#if showResetAction}
    <button class="reset-link mono" type="button" onclick={handleReset}>
      analyze another
    </button>
  {/if}

  {#if analysis.extraction_quality === 'partial'}
    <span
      class="quality-badge"
      style="color: var(--amb-text); border-color: var(--amb-border); background: var(--amb-bg);"
      title="Some structure was extracted. Results may be incomplete."
    >
      partial extraction
    </span>
  {:else if analysis.extraction_quality === 'minimal'}
    <span
      class="quality-badge"
      style="color: var(--neg-text); border-color: var(--neg-border); background: var(--neg-bg);"
      title="Very little structure found. Try a longer thought with more detail."
    >
      limited extraction
    </span>
  {:else}
    <div class="flex items-center gap-1.5">
      <div class="h-1.5 w-1.5 rounded-full" style="background: var(--status-ok);"></div>
      <span class="mono" style="font-size: 9px; color: var(--text-sec); letter-spacing: 0.1em;">
        extraction · full
      </span>
    </div>
  {/if}
</header>

<style>
  .mono {
    font-family: var(--font-mono);
  }

  .top-bar {
    border-bottom: 1px solid var(--border);
    background:
      linear-gradient(180deg, rgba(121, 166, 163, 0.08), transparent 18%),
      linear-gradient(135deg, rgba(199, 156, 87, 0.08), rgba(10, 12, 14, 0.82) 42%),
      rgba(9, 11, 13, 0.74);
    backdrop-filter: blur(10px);
  }

  .reset-link {
    border: 0;
    background: transparent;
    color: var(--text-sec);
    font-size: 9px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    cursor: pointer;
    transition:
      color var(--transition-fast),
      transform var(--transition-smooth);
  }

  .reset-link:hover,
  .reset-link:focus-visible {
    color: var(--accent-strong);
    transform: translateY(-1px);
    outline: none;
  }

  .quality-badge {
    font-family: var(--font-mono);
    font-size: 9px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 1px 6px;
    border: 1px solid;
    border-radius: 2px;
    line-height: 16px;
  }
</style>
