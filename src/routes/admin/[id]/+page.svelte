<!--
  Admin dashboard — detail view.

  Renders the full AnalysisView for a stored analysis.
  Adds a minimal admin context bar above the analysis:
    - Timestamp of when the analysis was stored
    - Extraction quality badge
    - "← back to list" link
    - "Delete" action (calls delete form action and redirects to list)

  The AnalysisView component renders identically to the main app —
  no special admin mode needed.
-->
<script lang="ts">
  import { enhance } from '$app/forms';

  import type { SelectionDetail } from '$lib/components/analysis/helpers';
  import AnalysisView from '$lib/components/AnalysisView.svelte';
  import {
    EMPTY_SELECTION_STATE,
    createActiveSetStore,
    selection,
    selectionState
  } from '$lib/stores';
  import type { FullAnalysis } from '$lib/types';
  import { formatRelativeTime } from '$lib/utils/time';

  export let data: {
    fullAnalysis: FullAnalysis;
    meta: {
      id: string;
      createdAt: number;
      extractionQuality: string;
    };
  };

  function resetSelectionState(): void {
    selectionState.set({ ...EMPTY_SELECTION_STATE });
  }

  function handleHover(event: CustomEvent<SelectionDetail>): void {
    selection.hover(event.detail.id, event.detail.kind);
  }

  function handleSelect(event: CustomEvent<SelectionDetail>): void {
    selection.select(event.detail.id, event.detail.kind);
  }

  function handleLeave(): void {
    selection.hoverLeave();
  }

  function handleDeselect(): void {
    selection.reset();
  }

  function handleDelete(event: Event): void {
    if (!window.confirm('Delete this analysis?')) {
      event.preventDefault();
    }
  }

  $: activeSetStore = createActiveSetStore(data.fullAnalysis.extraction);

  // Reset selection when navigating to a different analysis
  $: data.meta.id, resetSelectionState();
</script>

<div class="admin-detail">
  <div class="context-bar">
    <a href="/admin" class="nav-link">← back to list</a>
    <div class="spacer"></div>

    <span class="meta-text">{formatRelativeTime(data.meta.createdAt)}</span>

    {#if data.meta.extractionQuality === 'partial'}
      <span
        class="quality-badge"
        style="color: var(--amb-text); border-color: var(--amb-border); background: var(--amb-bg);"
      >
        partial
      </span>
    {:else if data.meta.extractionQuality === 'minimal'}
      <span
        class="quality-badge"
        style="color: var(--neg-text); border-color: var(--neg-border); background: var(--neg-bg);"
      >
        minimal
      </span>
    {/if}

    <form method="POST" action="?/delete" use:enhance onsubmit={handleDelete}>
      <button type="submit" class="delete-btn">delete</button>
    </form>
  </div>

  <AnalysisView
    fullAnalysis={data.fullAnalysis}
    selectionState={$selectionState}
    activeSet={$activeSetStore}
    on:hover={handleHover}
    on:select={handleSelect}
    on:leave={handleLeave}
    on:deselect={handleDeselect}
  />
</div>

<style>
  .admin-detail {
    min-height: 100dvh;
  }

  .context-bar {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 2rem;
    border-bottom: 1px solid var(--border);
    background: rgba(9, 11, 13, 0.74);
    backdrop-filter: blur(10px);
  }

  .nav-link {
    font-family: var(--font-mono);
    font-size: 9px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-sec);
    text-decoration: none;
    transition: color var(--transition-fast);
  }

  .nav-link:hover {
    color: var(--accent-strong);
  }

  .spacer {
    flex: 1;
  }

  .meta-text {
    font-family: var(--font-mono);
    font-size: 9px;
    letter-spacing: 0.08em;
    color: var(--text-muted);
  }

  .quality-badge {
    font-family: var(--font-mono);
    font-size: 8px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 1px 5px;
    border: 1px solid;
    border-radius: 2px;
    line-height: 14px;
    white-space: nowrap;
  }

  .delete-btn {
    font-family: var(--font-mono);
    font-size: 9px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-muted);
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 2px 4px;
    transition: color var(--transition-fast);
  }

  .delete-btn:hover {
    color: var(--neg-text);
  }
</style>
