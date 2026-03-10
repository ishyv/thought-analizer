<!--
  AnalysisView.svelte
  Three-panel analysis interface: annotated text | structure graph | insight rail.

  Props:
    analysis - a validated ThoughtAnalysis object (never null or minimal-unchecked)

  Selection state is managed by src/lib/stores.ts.
  Graph layout is computed by src/lib/graph.ts.
  Insight derivations come from src/lib/derive.ts.
  This component owns rendering only.
-->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  import AnalysisGraphPanel from '$lib/components/analysis/AnalysisGraphPanel.svelte';
  import AnalysisHeader from '$lib/components/analysis/AnalysisHeader.svelte';
  import AnalysisInsightRail from '$lib/components/analysis/AnalysisInsightRail.svelte';
  import AnalysisTextPanel from '$lib/components/analysis/AnalysisTextPanel.svelte';
  import MobileDrawer from '$lib/components/analysis/MobileDrawer.svelte';
  import type { SelectionDetail } from '$lib/components/analysis/helpers';
  import { buildGraphLayout } from '$lib/graph';
  import type { ActiveSet, SelectionState } from '$lib/stores';
  import type { ThoughtAnalysis } from '$lib/types';

  export let analysis: ThoughtAnalysis;
  export let selectionState: SelectionState;
  export let activeSet: ActiveSet;
  export let showResetAction = false;

  const dispatch = createEventDispatcher<{
    hover: SelectionDetail;
    select: SelectionDetail;
    leave: void;
    deselect: void;
    reset: void;
  }>();

  function forwardHover(event: CustomEvent<SelectionDetail>): void {
    dispatch('hover', event.detail);
  }

  function forwardSelect(event: CustomEvent<SelectionDetail>): void {
    dispatch('select', event.detail);
  }

  function forwardLeave(): void {
    dispatch('leave');
  }

  $: layout = buildGraphLayout(analysis);
</script>

<div class="analysis-shell">
  <AnalysisHeader {analysis} {showResetAction} on:reset={() => dispatch('reset')} />

  <div class="panel-grid">
    <!-- ── Text panel ─── -->
    <AnalysisTextPanel
      {analysis}
      {selectionState}
      {activeSet}
      on:hover={forwardHover}
      on:select={forwardSelect}
      on:leave={forwardLeave}
    />

    <!-- ── Graph panel ── -->
    <AnalysisGraphPanel
      {selectionState}
      {activeSet}
      {layout}
      on:hover={forwardHover}
      on:select={forwardSelect}
      on:leave={forwardLeave}
    />

    <!-- ── Insight rail ─ -->
    <AnalysisInsightRail
      {analysis}
      {selectionState}
      {activeSet}
      on:hover={forwardHover}
      on:select={forwardSelect}
      on:leave={forwardLeave}
    />
  </div>

  <!-- ── Mobile drawer ── -->
  <MobileDrawer {analysis} {selectionState} on:dismiss={() => dispatch('deselect')} />
</div>

<style>
  .analysis-shell {
    min-height: 100dvh;
    color: var(--text-pri);
  }

  .panel-grid {
    display: grid;
    grid-template-columns: minmax(0, 0.88fr) minmax(0, 1.12fr) 18.75rem;
    gap: 1px;
    min-height: calc(100dvh - 49px);
    background: var(--border);
  }

  @media (max-width: 1100px) {
    .panel-grid {
      grid-template-columns: 1fr;
      min-height: auto;
    }
  }
</style>
