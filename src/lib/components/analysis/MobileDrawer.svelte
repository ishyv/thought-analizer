<!--
  MobileDrawer.svelte
  Bottom sheet drawer for selection detail on narrow viewports (<768px).
  Slides up when an entity is selected, dismissed by backdrop tap or
  selection clear.
-->
<script lang="ts">
  import { createEventDispatcher, onDestroy } from 'svelte';

  import AnalysisSelectionDetail from '$lib/components/analysis/AnalysisSelectionDetail.svelte';
  import { getPhrase, getStatement } from '$lib/components/analysis/helpers';
  import type { Issue, PhraseGroup, Relation, StatementGroup, ThoughtAnalysis } from '$lib/types';
  import type { SelectionState } from '$lib/stores';

  export let analysis: ThoughtAnalysis;
  export let selectionState: SelectionState;

  const dispatch = createEventDispatcher<{ dismiss: void }>();

  $: isOpen = Boolean(selectionState.selectedId);

  $: selectedStatement =
    selectionState.selectedKind === 'statement'
      ? getStatement(analysis, selectionState.selectedId)
      : undefined;
  $: selectedPhrase =
    selectionState.selectedKind === 'phrase'
      ? getPhrase(analysis, selectionState.selectedId)
      : undefined;
  $: selectedRelation =
    selectionState.selectedKind === 'relation'
      ? analysis.relations.find((r) => r.id === selectionState.selectedId)
      : undefined;
  $: selectedIssue =
    selectionState.selectedKind === 'issue'
      ? analysis.issues.find((i) => i.id === selectionState.selectedId)
      : undefined;

  // Lock body scroll when drawer is open on mobile.
  $: if (typeof document !== 'undefined') {
    document.body.style.overflow = isOpen ? 'hidden' : '';
  }

  onDestroy(() => {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
    }
  });

  function handleDismiss(): void {
    dispatch('dismiss');
  }
</script>

<div class="drawer-root" class:open={isOpen}>
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div class="backdrop" onclick={handleDismiss}></div>
  <div class="sheet">
    <div class="handle-row">
      <div class="handle"></div>
    </div>
    <div class="sheet-content">
      <AnalysisSelectionDetail
        {analysis}
        {selectedStatement}
        {selectedPhrase}
        {selectedRelation}
        {selectedIssue}
      />
    </div>
  </div>
</div>

<style>
  .drawer-root {
    display: none;
  }

  @media (max-width: 767px) {
    .drawer-root {
      display: block;
      position: fixed;
      inset: 0;
      z-index: 100;
      pointer-events: none;
    }

    .drawer-root.open {
      pointer-events: auto;
    }

    .backdrop {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      opacity: 0;
      transition: opacity 0.2s ease;
    }

    .drawer-root.open .backdrop {
      opacity: 1;
    }

    .sheet {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      max-height: 60vh;
      background: var(--bg-elev);
      border-top: 1px solid var(--border);
      border-radius: 12px 12px 0 0;
      transform: translateY(100%);
      transition: transform 0.2s ease;
      overflow-y: auto;
    }

    .drawer-root.open .sheet {
      transform: translateY(0);
    }

    .handle-row {
      display: flex;
      justify-content: center;
      padding: 10px 0 4px;
    }

    .handle {
      width: 32px;
      height: 4px;
      border-radius: 999px;
      background: var(--text-muted);
      opacity: 0.5;
    }

    .sheet-content {
      padding: 0.75rem 1.25rem 1.5rem;
    }
  }
</style>
