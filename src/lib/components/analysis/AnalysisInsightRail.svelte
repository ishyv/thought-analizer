<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';

  import AnalysisDerivedInsights from '$lib/components/analysis/AnalysisDerivedInsights.svelte';
  import AnalysisIssueList from '$lib/components/analysis/AnalysisIssueList.svelte';
  import AnalysisSelectionDetail from '$lib/components/analysis/AnalysisSelectionDetail.svelte';
  import FilterBar from '$lib/components/analysis/FilterBar.svelte';
  import { getPhrase, getStatement, type SelectionDetail } from '$lib/components/analysis/helpers';
  import { dominantPattern, mainTension } from '$lib/derive';
  import type { ActiveSet, SelectionState } from '$lib/stores';
  import type { ReframeQuestion, StructuralReading, ThoughtAnalysis } from '$lib/types';

  export let analysis: ThoughtAnalysis;
  export let reading: StructuralReading | null = null;
  export let reframe: ReframeQuestion | null = null;
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

<aside class="rail">
  <div class="rail-inner">
    <FilterBar {analysis} />

    <!-- ── Summary ── -->
    <div class="rail-section">
      <div class="section-header">
        <span class="section-label">summary</span>
        <div class="section-rule"></div>
      </div>
      <p class="body-text body-italic">
        {analysis.summary}
      </p>
    </div>

    <!-- ── Heuristic pattern ── -->
    <div class="rail-section">
      <div class="section-header">
        <span class="section-label">pattern</span>
        <div class="section-rule"></div>
      </div>
      <p class="body-text">
        {pattern}
      </p>
    </div>

    <!-- ── Deep reading (Pass 2) ── -->
    {#if reading}
      <div class="reading-block" in:fly={{ y: 12, duration: 500, easing: quintOut }}>
        <div class="reading-accent-bar"></div>

        <div class="reading-content">
          <div class="reading-section">
            <span class="reading-field-label">structural pattern</span>
            <p class="reading-pattern-text">{reading.pattern}</p>
          </div>

          <div class="reading-section">
            <span class="reading-field-label">deep tension</span>
            <p class="body-text">{reading.deepTension}</p>
          </div>

          <div class="reading-section" in:fade={{ duration: 300, delay: 100 }}>
            <span class="reading-field-label">hidden assumption</span>
            <p class="body-text body-sec body-italic">{reading.hiddenAssumption}</p>
          </div>

          {#if reading.subtext}
            <div class="reading-section" in:fade={{ duration: 300, delay: 200 }}>
              <span class="reading-field-label">subtext</span>
              <p class="body-text body-muted body-italic body-sm">
                {reading.subtext}
              </p>
            </div>
          {/if}
        </div>
      </div>
    {/if}

    <!-- ── Tensions ── -->
    <div class="rail-section">
      <div class="section-header">
        <span class="section-label">tensions</span>
        <div class="section-rule"></div>
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

    <!-- ── Selection detail ── -->
    {#if selectionState.selectedId}
      <div class="rail-section">
        <div class="section-header">
          <span class="section-label">selected</span>
          <div class="section-rule"></div>
        </div>

        <AnalysisSelectionDetail {analysis} {selectedStatement} {selectedPhrase} {selectedRelation} {selectedIssue} />
      </div>
    {:else}
      <p class="hint-text">hover or click any element<br />to inspect its connections</p>
    {/if}

    <!-- ── Reframe question (Pass 3) ── -->
    {#if reframe}
      <div class="reframe-block" in:fly={{ y: 16, duration: 600, delay: 100, easing: quintOut }}>
        <div class="reframe-rule"></div>

        <div class="reframe-content">
          <p class="reframe-question">{reframe.question}</p>

          <p class="reframe-rationale">
            <span class="reframe-arrow">↳</span> {reframe.rationale}
          </p>
        </div>
      </div>
    {/if}
  </div>
</aside>

<style>
  /* ── Rail shell ── */

  .rail {
    background:
      linear-gradient(180deg, rgba(121, 166, 163, 0.04), transparent 20%),
      rgba(8, 9, 11, 0.82);
    position: relative;
    overflow-y: auto;
    padding: 1.5rem 1.25rem;
  }

  .rail::before {
    content: '';
    position: absolute;
    inset: 0.75rem;
    border: 1px solid rgba(121, 166, 163, 0.1);
    pointer-events: none;
    opacity: 0.35;
  }

  .rail-inner {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  /* ── Sections ── */

  .rail-section {
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

  /* ── Body text ── */

  .body-text {
    margin: 0;
    font-family: var(--font-body);
    font-size: 13px;
    line-height: 1.7; /* Increased for readability */
    color: var(--text-pri);
    max-width: 28rem;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }

  .body-italic {
    font-style: italic;
  }

  .body-sec {
    color: var(--text-sec);
  }

  .body-muted {
    color: var(--text-muted);
  }

  .body-sm {
    font-size: 12px;
  }

  /* ── Reading block ── */

  .reading-block {
    display: flex;
    gap: 0;
    border-radius: 4px;
    overflow: hidden;
  }

  .reading-accent-bar {
    width: 3px;
    flex-shrink: 0;
    background: linear-gradient(
      180deg,
      var(--accent) 0%,
      var(--signal) 100%
    );
    opacity: 0.8;
  }

  .reading-content {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 1rem; /* Increased spacing between insight lines */
    padding: 1rem 1.2rem;
    background: linear-gradient(
      90deg,
      rgba(199, 156, 87, 0.08),
      rgba(199, 156, 87, 0.01) 80%
    );
  }

  .reading-section {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  .reading-field-label {
    font-family: var(--font-mono);
    font-size: 8px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--accent); /* More emphasis on labels inside the reading block */
    opacity: 0.9;
  }

  .reading-pattern-text {
    margin: 0;
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--amb-text);
    line-height: 1.6;
    word-wrap: break-word;
  }

  /* ── Reframe block (CTA) ── */

  .reframe-block {
    margin-top: 1rem;
    padding: 1.25rem;
    background: rgba(199, 156, 87, 0.06);
    border: 1px solid rgba(199, 156, 87, 0.2);
    border-radius: 4px;
    position: relative;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  }

  .reframe-rule {
    display: none; /* Changed to styled box above instead of top rule */
  }

  .reframe-content {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }

  .reframe-question {
    margin: 0;
    font-family: var(--font-body);
    font-size: 18px;
    font-weight: 500;
    color: #fff; /* Make it pop */
    line-height: 1.5;
    letter-spacing: -0.01em;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }

  .reframe-rationale {
    margin: 0;
    font-family: var(--font-mono);
    font-size: 9px;
    color: var(--text-muted);
    line-height: 1.6;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }

  .reframe-arrow {
    color: var(--accent);
    opacity: 0.6;
  }

  /* ── Hint ── */

  .hint-text {
    margin: 0;
    font-family: var(--font-mono);
    font-size: 9px;
    line-height: 1.6;
    color: var(--text-muted);
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }
</style>
