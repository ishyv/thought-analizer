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

<section class="panel overflow-y-auto p-7">
  <div class="panel-inner flex flex-col gap-5">
    <div class="divider-row">
      <span class="divider-label">input</span>
      <div class="divider-line"></div>
    </div>

    <AnalysisAnnotatedText
      {spans}
      {selectionState}
      {activeSet}
      on:hover={forwardHover}
      on:select={forwardSelect}
      on:leave={forwardLeave}
    />

    <div class="mt-2 flex flex-col gap-2">
      <div class="divider-row">
        <span class="divider-label">statements</span>
        <div class="divider-line"></div>
      </div>

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
</section>

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
</style>
