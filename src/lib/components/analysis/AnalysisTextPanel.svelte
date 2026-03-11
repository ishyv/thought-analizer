<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  import AnalysisAnnotatedText from '$lib/components/analysis/AnalysisAnnotatedText.svelte';
  import AnalysisStatementList from '$lib/components/analysis/AnalysisStatementList.svelte';
  import { buildAnnotatedSpans, type SelectionDetail } from '$lib/components/analysis/helpers';
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

  $: spans = buildAnnotatedSpans(analysis.input_text, analysis.phrase_groups);
</script>

<section class="text-panel">
  <div class="panel-inner">
    <div class="section">
      <div class="section-header">
        <span class="section-label">input</span>
        <div class="section-rule"></div>
      </div>

      <div class="text-block">
        <AnalysisAnnotatedText
          {spans}
          {selectionState}
          {activeSet}
          on:hover={forwardHover}
          on:select={forwardSelect}
          on:leave={forwardLeave}
        />
      </div>
    </div>

    <div class="section">
      <div class="section-header">
        <span class="section-label">statements</span>
        <div class="section-rule"></div>
      </div>

      <div class="statements-block">
        <AnalysisStatementList
          statements={analysis.statement_groups}
          phraseGroups={analysis.phrase_groups}
          {selectionState}
          {activeSet}
          on:hover={forwardHover}
          on:select={forwardSelect}
          on:leave={forwardLeave}
        />
      </div>
    </div>
  </div>
</section>

<style>
  .text-panel {
    background:
      linear-gradient(135deg, rgba(199, 156, 87, 0.03), transparent 40%),
      rgba(8, 9, 11, 0.82);
    position: relative;
    overflow-y: auto;
    padding: 1.5rem 1.5rem;
  }

  .text-panel::before {
    content: '';
    position: absolute;
    inset: 0.75rem;
    border: 1px solid rgba(121, 166, 163, 0.1);
    pointer-events: none;
    opacity: 0.35;
  }

  .panel-inner {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
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

  .text-block {
    word-wrap: break-word;
    overflow-wrap: break-word;
  }

  .statements-block {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }
</style>
