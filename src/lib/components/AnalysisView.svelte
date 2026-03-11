<!--
  AnalysisView.svelte
  Three-panel analysis interface: annotated text | structure graph | insight rail.

  Props:
    fullAnalysis - a FullAnalysis object containing all three pass outputs.

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
  import type { FullAnalysis } from '$lib/types';

  export let fullAnalysis: FullAnalysis;
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

  $: extraction = fullAnalysis.extraction;
  $: reading = fullAnalysis.reading;
  $: reframe = fullAnalysis.reframe;
  $: layout = buildGraphLayout(extraction);
</script>

<div class="analysis-shell">
  <AnalysisHeader analysis={extraction} {showResetAction} on:reset={() => dispatch('reset')} />

  <div class="panel-grid">
    <!-- Scan band — ambient "active system" indicator -->
    <div class="scan-band" aria-hidden="true"></div>

    <!-- ── Text panel ─── -->
    <AnalysisTextPanel
      analysis={extraction}
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
      analysis={extraction}
      {reading}
      {reframe}
      {selectionState}
      {activeSet}
      on:hover={forwardHover}
      on:select={forwardSelect}
      on:leave={forwardLeave}
    />
  </div>

  <!-- ── Mobile drawer ── -->
  <MobileDrawer analysis={extraction} {selectionState} on:dismiss={() => dispatch('deselect')} />
</div>

<style>
  .analysis-shell {
    min-height: 100dvh;
    color: var(--text-pri);
  }

  .panel-grid {
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 0.88fr) minmax(0, 1.12fr) 18.75rem;
    gap: 1px;
    min-height: calc(100dvh - 49px);
    background: var(--border);
  }

  /* Scan band — slow horizontal sweep for "active system" feel */
  .scan-band {
    position: absolute;
    top: 0;
    left: 0;
    width: 18%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(199, 156, 87, 0.03),
      transparent
    );
    animation: scan 8s linear infinite;
    pointer-events: none;
    z-index: 2;
    opacity: 0.5;
  }

  @keyframes scan {
    from { transform: translateX(-120%); }
    to   { transform: translateX(620%); }
  }

  @media (max-width: 1100px) {
    .panel-grid {
      grid-template-columns: 1fr;
      min-height: auto;
    }

    .scan-band {
      display: none;
    }
  }
</style>
