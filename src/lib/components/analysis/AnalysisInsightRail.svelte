<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  import AnalysisDerivedInsights from '$lib/components/analysis/AnalysisDerivedInsights.svelte';
  import AnalysisIssueList from '$lib/components/analysis/AnalysisIssueList.svelte';
  import AnalysisSelectionDetail from '$lib/components/analysis/AnalysisSelectionDetail.svelte';
  import FilterBar from '$lib/components/analysis/FilterBar.svelte';
  import { getPhrase, getStatement, type SelectionDetail } from '$lib/components/analysis/helpers';
  import { dominantPattern, mainTension } from '$lib/derive';
  import type { ActiveSet, SelectionState } from '$lib/stores';
  import type { ThoughtAnalysis } from '$lib/types';

  export let analysis: ThoughtAnalysis;
  export let selectionState: SelectionState;
  export let activeSet: ActiveSet;

  const dispatch = createEventDispatcher<{
    hover: SelectionDetail;
    select: SelectionDetail;
    leave: void;
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

  $: pattern = dominantPattern(analysis);
  $: featuredIssue = mainTension(analysis);
  $: remainingIssues = featuredIssue
    ? analysis.issues.filter((issue) => issue.id !== featuredIssue.id)
    : analysis.issues;
  $: hasSelection = Boolean(selectionState.selectedId);
  $: selectedStatement =
    selectionState.selectedKind === 'statement'
      ? getStatement(analysis, selectionState.selectedId)
      : undefined;
  $: selectedPhrase =
    selectionState.selectedKind === 'phrase' ? getPhrase(analysis, selectionState.selectedId) : undefined;
  $: selectedRelation =
    selectionState.selectedKind === 'relation'
      ? analysis.relations.find((r) => r.id === selectionState.selectedId)
      : undefined;
  $: selectedIssue =
    selectionState.selectedKind === 'issue'
      ? analysis.issues.find((i) => i.id === selectionState.selectedId)
      : undefined;
</script>

<aside class="panel overflow-y-auto p-7">
  <div class="panel-inner flex flex-col gap-6">
    <FilterBar {analysis} />

    <div>
      <div class="divider-row mb-3">
        <span class="divider-label">summary</span>
        <div class="divider-line"></div>
      </div>
      <p class="serif m-0 leading-relaxed italic" style="font-size: 13px; color: var(--text-pri);">
        {analysis.summary}
      </p>
    </div>

    <div>
      <div class="divider-row mb-3">
        <span class="divider-label">pattern</span>
        <div class="divider-line"></div>
      </div>
      <p class="serif m-0 leading-relaxed" style="font-size: 13px; color: var(--text-pri);">
        {pattern}
      </p>
    </div>

    <div>
      <div class="divider-row mb-3">
        <span class="divider-label">tensions</span>
        <div class="divider-line"></div>
      </div>

      <AnalysisIssueList
        {featuredIssue}
        issues={remainingIssues}
        {activeSet}
        {hasSelection}
        on:hover={forwardHover}
        on:select={forwardSelect}
        on:leave={forwardLeave}
      />
    </div>

    <AnalysisDerivedInsights {analysis} mainTensionId={featuredIssue?.id ?? null} />

    {#if selectionState.selectedId}
      <div>
        <div class="divider-row mb-3">
          <span class="divider-label">selected</span>
          <div class="divider-line"></div>
        </div>

        <AnalysisSelectionDetail {analysis} {selectedStatement} {selectedPhrase} {selectedRelation} {selectedIssue} />
      </div>
    {:else}
      <p class="empty-note">hover or click any element<br />to inspect its connections</p>
    {/if}
  </div>
</aside>

<style>
  .panel {
    background: rgba(8, 9, 11, 0.8);
    position: relative;
  }

  .panel::before {
    content: '';
    position: absolute;
    inset: 0.9rem;
    border: 1px solid rgba(121, 166, 163, 0.12);
    pointer-events: none;
    opacity: 0.4;
  }

  .panel-inner {
    position: relative;
    z-index: 1;
  }

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

  .divider-label,
  .empty-note {
    font-family: var(--font-mono);
    text-transform: uppercase;
  }

  .divider-label {
    font-size: 9px;
    letter-spacing: 0.15em;
    color: var(--text-sec);
  }

  .empty-note {
    margin: 0;
    font-size: 9px;
    line-height: 1.6;
    color: var(--text-muted);
    letter-spacing: 0.1em;
  }
</style>
