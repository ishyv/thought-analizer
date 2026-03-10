<script lang="ts">
  import { readable, type Readable } from 'svelte/store';

  import type { SelectionDetail } from '$lib/components/analysis/helpers';
  import AnalysisView from '$lib/components/AnalysisView.svelte';
  import InputView from '$lib/components/InputView.svelte';
  import ProcessingView from '$lib/components/ProcessingView.svelte';
  import { extractAnalysis } from '$lib/extract';
  import {
    EMPTY_ACTIVE_SET,
    EMPTY_SELECTION_STATE,
    createActiveSetStore,
    selection,
    selectionState,
    type ActiveSet
  } from '$lib/stores';
  import type { ThoughtAnalysis } from '$lib/types';

  type AppState =
    | { phase: 'idle' }
    | { phase: 'processing'; inputText: string }
    | { phase: 'result'; analysis: ThoughtAnalysis };

  const EMPTY_ACTIVE_SET_STORE = readable<ActiveSet>(EMPTY_ACTIVE_SET);

  let state: AppState = { phase: 'idle' };
  let activeSetStore: Readable<ActiveSet> = EMPTY_ACTIVE_SET_STORE;
  let requestId = 0;

  function clearSelectionState(): void {
    selectionState.set({ ...EMPTY_SELECTION_STATE });
    selection.resetSelection();
  }

  async function handleSubmit(event: CustomEvent<{ text: string }>): Promise<void> {
    const inputText = event.detail.text.trim();

    if (!inputText) return;

    requestId += 1;
    const currentRequestId = requestId;

    clearSelectionState();
    state = { phase: 'processing', inputText };

    const analysis = await extractAnalysis(inputText);

    if (currentRequestId !== requestId) {
      return;
    }

    clearSelectionState();
    state = { phase: 'result', analysis };
  }

  function handleReset(): void {
    requestId += 1;
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

  $: activeSetStore =
    state.phase === 'result' ? createActiveSetStore(state.analysis) : EMPTY_ACTIVE_SET_STORE;
</script>

{#if state.phase === 'idle'}
  <InputView on:submit={handleSubmit} />
{:else if state.phase === 'processing'}
  <ProcessingView inputText={state.inputText} />
{:else}
  <AnalysisView
    analysis={state.analysis}
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
