<script lang="ts">
  import { onMount } from 'svelte';
  import { readable, type Readable } from 'svelte/store';

  import { browser } from '$app/environment';
  import type { SelectionDetail } from '$lib/components/analysis/helpers';
  import AnalysisView from '$lib/components/AnalysisView.svelte';
  import InputView from '$lib/components/InputView.svelte';
  import ProcessingView from '$lib/components/ProcessingView.svelte';
  import { runPipeline } from '$lib/extract';
  import { isExtractRequestError } from '$lib/rate-limit';
  import {
    clearHistory,
    loadHistory,
    removeFromHistory,
    saveToHistory,
    type HistoryEntry
  } from '$lib/history';
  import {
    EMPTY_ACTIVE_SET,
    EMPTY_SELECTION_STATE,
    createActiveSetStore,
    selection,
    selectionState,
    type ActiveSet
  } from '$lib/stores';
  import type { FullAnalysis, PipelinePhase } from '$lib/types';

  type AppState =
    | { phase: 'idle' }
    | {
        phase: 'processing';
        inputText: string;
        pipelinePhase: PipelinePhase;
        partial: Partial<FullAnalysis>;
      }
    | { phase: 'result'; fullAnalysis: FullAnalysis };

  const EMPTY_ACTIVE_SET_STORE = readable<ActiveSet>(EMPTY_ACTIVE_SET);

  let state: AppState = { phase: 'idle' };
  let activeSetStore: Readable<ActiveSet> = EMPTY_ACTIVE_SET_STORE;
  let requestId = 0;
  let history: HistoryEntry[] = [];
  let prefilledText = '';
  let inputError = '';

  onMount(() => {
    if (browser) history = loadHistory();
  });

  function clearSelectionState(): void {
    selectionState.set({ ...EMPTY_SELECTION_STATE });
    selection.resetSelection();
  }

  async function handleSubmit(event: CustomEvent<{ text: string }>): Promise<void> {
    const inputText = event.detail.text.trim();

    if (!inputText) return;

    inputError = '';

    if (browser) history = saveToHistory(inputText);

    requestId += 1;
    const currentRequestId = requestId;

    clearSelectionState();
    state = {
      phase: 'processing',
      inputText,
      pipelinePhase: 'extracting',
      partial: {}
    };

    try {
      const fullAnalysis = await runPipeline(inputText, (pipelinePhase, partial) => {
        if (currentRequestId !== requestId) return;

        // Svelte reactivity: reassign to trigger update
        state = {
          phase: 'processing',
          inputText,
          pipelinePhase,
          partial
        };
      });

      if (currentRequestId !== requestId) return;

      // Save to DB (fire and forget)
      try {
        await fetch('/api/persist', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ text: inputText, fullAnalysis })
        });
      } catch {
        /* non-fatal */
      }

      clearSelectionState();
      state = { phase: 'result', fullAnalysis };
    } catch (error) {
      if (currentRequestId !== requestId) return;

      clearSelectionState();
      prefilledText = inputText;
      inputError = isExtractRequestError(error) ? error.message : 'Analysis failed. Try again.';
      state = { phase: 'idle' };
    }
  }

  function handleReset(): void {
    requestId += 1;
    inputError = '';
    clearSelectionState();
    state = { phase: 'idle' };
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

  function handleHistorySelect(text: string): void {
    inputError = '';
    prefilledText = text;
  }

  function handleHistoryRemove(id: string): void {
    if (browser) history = removeFromHistory(id);
  }

  function handleHistoryClear(): void {
    if (browser) {
      clearHistory();
      history = [];
    }
  }

  $: activeSetStore =
    state.phase === 'result'
      ? createActiveSetStore(state.fullAnalysis.extraction)
      : EMPTY_ACTIVE_SET_STORE;
</script>

{#if state.phase === 'idle'}
  <InputView
    {prefilledText}
    errorMessage={inputError}
    {history}
    onHistorySelect={handleHistorySelect}
    onHistoryRemove={handleHistoryRemove}
    onHistoryClear={handleHistoryClear}
    on:submit={handleSubmit}
  />
{:else if state.phase === 'processing'}
  <ProcessingView
    inputText={state.inputText}
    pipelinePhase={state.pipelinePhase}
    partial={state.partial}
  />
{:else}
  <AnalysisView
    fullAnalysis={state.fullAnalysis}
    selectionState={$selectionState}
    activeSet={$activeSetStore}
    showResetAction
    on:hover={handleHover}
    on:select={handleSelect}
    on:leave={handleLeave}
    on:deselect={handleDeselect}
    on:reset={handleReset}
  />
{/if}
