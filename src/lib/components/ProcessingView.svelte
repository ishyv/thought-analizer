<!--
  ProcessingView.svelte
  Transitional loading state with live pipeline progress display.

  Props:
    inputText     - the user-submitted thought currently being processed
    pipelinePhase - current phase of the multi-pass pipeline
    partial       - partial FullAnalysis accumulated so far
-->
<script lang="ts">
  import AnalysisTextPanel from '$lib/components/analysis/AnalysisTextPanel.svelte';
  import { EMPTY_ACTIVE_SET } from '$lib/stores';
  import type {
    FullAnalysis,
    PipelinePhase
  } from '$lib/types';

  export let inputText: string;
  export let pipelinePhase: PipelinePhase;
  export let partial: Partial<FullAnalysis>;

  /** Phase descriptions shown below the step list. */
  const PHASE_DESCRIPTIONS: Record<PipelinePhase, string> = {
    extracting: 'Identifying phrases, statements, and relationships\u2026',
    reading: 'Reasoning about the structure of the thought\u2026',
    reframing: 'Finding the question that opens it\u2026',
    complete: ''
  };

  interface StepConfig {
    key: PipelinePhase;
    label: string;
  }

  const STEPS: StepConfig[] = [
    { key: 'extracting', label: 'Extracting structure' },
    { key: 'reading', label: 'Reading the pattern' },
    { key: 'reframing', label: 'Finding the question' }
  ];

  const PHASE_ORDER: PipelinePhase[] = ['extracting', 'reading', 'reframing', 'complete'];

  function stepState(
    stepKey: PipelinePhase,
    currentPhase: PipelinePhase
  ): 'pending' | 'active' | 'complete' {
    const stepIdx = PHASE_ORDER.indexOf(stepKey);
    const currentIdx = PHASE_ORDER.indexOf(currentPhase);

    if (currentIdx > stepIdx) return 'complete';
    if (currentIdx === stepIdx) return 'active';
    return 'pending';
  }

  /** Stub selection state for preview mode. */
  const EMPTY_SELECTION = {
    hoveredId: null,
    hoveredKind: null,
    selectedId: null,
    selectedKind: null
  } as const;

  $: hasPreview = partial.extraction !== undefined;
  $: currentDescription = PHASE_DESCRIPTIONS[pipelinePhase];
</script>

<section class="processing-shell" class:has-preview={hasPreview} aria-label="Processing">
  {#if hasPreview && partial.extraction}
    <div class="preview-panel">
      <AnalysisTextPanel
        analysis={partial.extraction}
        selectionState={EMPTY_SELECTION}
        activeSet={EMPTY_ACTIVE_SET}
      />
    </div>
  {/if}

  <div class="progress-panel">
    {#if !hasPreview}
      <p class="echo">{inputText}</p>
    {/if}

    <div class="step-list" aria-label="Pipeline progress">
      {#each STEPS as step (step.key)}
        {@const state = stepState(step.key, pipelinePhase)}
        <div class="step" class:step-active={state === 'active'} class:step-complete={state === 'complete'}>
          <span class="step-dot" class:dot-pulse={state === 'active'}></span>
          <span class="step-label">{step.label}</span>
        </div>
      {/each}
    </div>

    {#if currentDescription}
      <p class="phase-description">{currentDescription}</p>
    {/if}
  </div>
</section>

<style>
  .processing-shell {
    min-height: 100dvh;
    display: grid;
    place-items: center;
    padding: clamp(2rem, 7vw, 6rem);
  }

  .processing-shell.has-preview {
    grid-template-columns: 1fr 1fr;
    place-items: stretch;
    gap: 1px;
    padding: 0;
    background: var(--border);
  }

  .preview-panel {
    opacity: 0.6;
    overflow-y: auto;
    max-height: 100dvh;
  }

  .progress-panel {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1.5rem;
    padding: clamp(2rem, 5vw, 4rem);
    background: var(--bg-pri);
  }

  .echo {
    margin: 0;
    color: var(--text-sec);
    font-family: var(--font-body);
    font-size: clamp(1rem, 2.2vw, 1.2rem);
    font-style: italic;
    line-height: 1.7;
    text-align: center;
    opacity: 0.75;
    max-width: 36rem;
  }

  .step-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .step {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .step-dot {
    width: 6px;
    height: 6px;
    border-radius: 999px;
    background: var(--text-muted);
    flex-shrink: 0;
    transition: background 0.3s ease;
  }

  .step-active .step-dot {
    background: var(--pos-text);
  }

  .step-complete .step-dot {
    background: var(--pos-text);
  }

  .dot-pulse {
    animation: pulse-opacity 1.2s ease-in-out infinite;
  }

  .step-label {
    font-family: var(--font-mono);
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    color: var(--text-muted);
    transition: color 0.3s ease;
  }

  .step-active .step-label {
    color: var(--text-sec);
  }

  .step-complete .step-label {
    color: var(--text-pri);
  }

  .phase-description {
    margin: 0;
    font-family: var(--font-body);
    font-size: 13px;
    font-style: italic;
    color: var(--text-sec);
    text-align: center;
  }

  @keyframes pulse-opacity {
    0%, 100% {
      opacity: 0.3;
    }
    50% {
      opacity: 1;
    }
  }

  @media (max-width: 900px) {
    .processing-shell.has-preview {
      grid-template-columns: 1fr;
      grid-template-rows: auto 1fr;
    }

    .preview-panel {
      max-height: 50dvh;
    }
  }
</style>
