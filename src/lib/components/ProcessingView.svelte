<!--
  ProcessingView.svelte
  Theatrical pipeline display with progressive reveal, staggered
  animations, and smooth layout transitions as each pass completes.

  Props:
    inputText     - the user-submitted thought currently being processed
    pipelinePhase - current phase of the multi-pass pipeline
    partial       - partial FullAnalysis accumulated so far
-->
<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { fly, fade } from 'svelte/transition';
  import { cubicOut, quintOut } from 'svelte/easing';

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
    index: number;
  }

  const STEPS: StepConfig[] = [
    { key: 'extracting', label: 'Extracting structure', index: 0 },
    { key: 'reading', label: 'Reading the pattern', index: 1 },
    { key: 'reframing', label: 'Finding the question', index: 2 }
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
  $: hasReading = partial.reading !== undefined && partial.reading !== null;

  // Track phase changes for description crossfade
  let descriptionKey = 0;
  let prevPhase = pipelinePhase;
  $: if (pipelinePhase !== prevPhase) {
    prevPhase = pipelinePhase;
    descriptionKey += 1;
  }

  // Entrance animation gate
  let mounted = false;
  onMount(async () => {
    await tick();
    mounted = true;
  });
</script>

<section
  class="processing-shell"
  class:has-preview={hasPreview}
  aria-label="Processing"
>
  <!-- ── Left: Text preview (slides in from left after Pass 1) ── -->
  {#if hasPreview && partial.extraction}
    <div
      class="preview-panel"
      in:fly={{ x: -60, duration: 700, easing: quintOut }}
    >
      <div class="preview-inner">
        <AnalysisTextPanel
          analysis={partial.extraction}
          selectionState={EMPTY_SELECTION}
          activeSet={EMPTY_ACTIVE_SET}
        />
      </div>
      <div class="preview-veil"></div>
    </div>
  {/if}

  <!-- ── Right / Center: Progress panel ── -->
  <div class="progress-panel">
    <div class="progress-content">
      <!-- Echoed input text (fades out when preview arrives) -->
      {#if !hasPreview}
        <div
          class="echo-container"
          out:fade={{ duration: 400, easing: cubicOut }}
        >
          {#if mounted}
            <p
              class="echo"
              in:fly={{ y: 20, duration: 600, delay: 200, easing: quintOut }}
            >
              {inputText}
            </p>
          {/if}
        </div>
      {/if}

      <!-- Step list with staggered entry -->
      <div class="step-list" aria-label="Pipeline progress">
        {#each STEPS as step (step.key)}
          {@const state = stepState(step.key, pipelinePhase)}
          {#if mounted}
            <div
              class="step"
              class:step-active={state === 'active'}
              class:step-complete={state === 'complete'}
              class:step-pending={state === 'pending'}
              in:fly={{ y: 12, duration: 500, delay: 300 + step.index * 120, easing: quintOut }}
            >
              <span class="step-track">
                <!-- Connector line above (not on first step) -->
                {#if step.index > 0}
                  <span
                    class="step-connector"
                    class:connector-lit={state !== 'pending'}
                  ></span>
                {/if}

                <!-- Dot with ring animation -->
                <span class="step-dot-container">
                  <span
                    class="step-dot"
                    class:dot-pulse={state === 'active'}
                    class:dot-complete={state === 'complete'}
                  ></span>
                  {#if state === 'active'}
                    <span class="dot-ring" in:fade={{ duration: 300 }}></span>
                  {/if}
                </span>
              </span>

              <span class="step-text">
                <span class="step-label">{step.label}</span>
                {#if state === 'complete'}
                  <span
                    class="step-check"
                    in:fly={{ x: -6, duration: 300, easing: cubicOut }}
                  >✓</span>
                {/if}
              </span>
            </div>
          {/if}
        {/each}
      </div>

      <!-- Phase description with crossfade -->
      {#if currentDescription}
        {#key descriptionKey}
          <p
            class="phase-description"
            in:fly={{ y: 8, duration: 400, easing: quintOut }}
            out:fade={{ duration: 200 }}
          >
            {currentDescription}
          </p>
        {/key}
      {/if}

      <!-- Reading preview card (appears during Pass 3) -->
      {#if hasReading && partial.reading}
        <div
          class="reading-preview"
          in:fly={{ y: 16, duration: 500, delay: 100, easing: quintOut }}
        >
          <span class="reading-label">pattern detected</span>
          <p class="reading-pattern">{partial.reading.pattern}</p>
          {#if partial.reading.deepTension}
            <p
              class="reading-tension"
              in:fade={{ duration: 400, delay: 200 }}
            >
              {partial.reading.deepTension}
            </p>
          {/if}
        </div>
      {/if}
    </div>
  </div>
</section>

<style>
  .processing-shell {
    min-height: 100dvh;
    display: grid;
    place-items: center;
    padding: clamp(2rem, 7vw, 6rem);
    transition: grid-template-columns 0.7s cubic-bezier(0.22, 1, 0.36, 1),
                padding 0.7s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .processing-shell.has-preview {
    grid-template-columns: 1.1fr 0.9fr;
    place-items: stretch;
    gap: 1px;
    padding: 0;
    background: var(--border);
  }

  /* ── Preview panel ── */

  .preview-panel {
    position: relative;
    overflow-y: auto;
    max-height: 100dvh;
    background: var(--bg);
  }

  .preview-inner {
    opacity: 0.65;
    transition: opacity 1.2s ease;
  }

  .preview-panel:hover .preview-inner {
    opacity: 0.8;
  }

  .preview-veil {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(
      to right,
      transparent 70%,
      rgba(8, 9, 11, 0.6) 100%
    );
  }

  /* ── Progress panel ── */

  .progress-panel {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: clamp(2rem, 5vw, 4rem);
    background: var(--bg);
    min-height: 100%;
  }

  .progress-content {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2rem;
    max-width: 22rem;
    width: 100%;
  }

  .processing-shell:not(.has-preview) .progress-content {
    align-items: center;
  }

  /* ── Echo text ── */

  .echo-container {
    width: 100%;
  }

  .echo {
    margin: 0;
    color: var(--text-sec);
    font-family: var(--font-body);
    font-size: clamp(1rem, 2.2vw, 1.15rem);
    font-style: italic;
    line-height: 1.7;
    text-align: center;
    opacity: 0.65;
    max-width: 36rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--border);
  }

  /* ── Step list ── */

  .step-list {
    display: flex;
    flex-direction: column;
    gap: 0;
    width: 100%;
  }

  .step {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 0;
    transition: opacity 0.4s ease;
  }

  .step-pending {
    opacity: 0.35;
  }

  .step-active,
  .step-complete {
    opacity: 1;
  }

  /* ── Step track (dots + connectors) ── */

  .step-track {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 18px;
    flex-shrink: 0;
    gap: 0;
    position: relative;
  }

  .step-connector {
    width: 1px;
    height: 12px;
    background: var(--text-muted);
    opacity: 0.25;
    transition: background 0.5s ease, opacity 0.5s ease;
  }

  .connector-lit {
    background: var(--pos-text);
    opacity: 0.6;
  }

  .step-dot-container {
    position: relative;
    width: 8px;
    height: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .step-dot {
    width: 6px;
    height: 6px;
    border-radius: 999px;
    background: var(--text-muted);
    flex-shrink: 0;
    transition: background 0.5s ease,
                transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
                box-shadow 0.5s ease;
    z-index: 1;
  }

  .dot-pulse {
    background: var(--pos-text);
    transform: scale(1.2);
    box-shadow: 0 0 8px rgba(121, 166, 163, 0.4);
    animation: pulse-glow 1.4s ease-in-out infinite;
  }

  .dot-complete {
    background: var(--pos-text);
    transform: scale(1);
  }

  .dot-ring {
    position: absolute;
    inset: -5px;
    border-radius: 999px;
    border: 1px solid var(--pos-text);
    opacity: 0;
    animation: ring-expand 1.4s ease-out infinite;
  }

  /* ── Step text ── */

  .step-text {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .step-label {
    font-family: var(--font-mono);
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--text-muted);
    transition: color 0.5s ease;
  }

  .step-active .step-label {
    color: var(--text-sec);
  }

  .step-complete .step-label {
    color: var(--text-pri);
  }

  .step-check {
    font-family: var(--font-mono);
    font-size: 9px;
    color: var(--pos-text);
    opacity: 0.8;
  }

  /* ── Phase description ── */

  .phase-description {
    margin: 0;
    font-family: var(--font-body);
    font-size: 13px;
    font-style: italic;
    color: var(--text-sec);
    opacity: 0.7;
    line-height: 1.6;
  }

  /* ── Reading preview card ── */

  .reading-preview {
    width: 100%;
    padding: 1rem 1.25rem;
    background: rgba(121, 166, 163, 0.04);
    border: 1px solid rgba(121, 166, 163, 0.1);
    border-radius: 3px;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .reading-label {
    font-family: var(--font-mono);
    font-size: 8px;
    text-transform: uppercase;
    letter-spacing: 0.18em;
    color: var(--pos-text);
    opacity: 0.7;
  }

  .reading-pattern {
    margin: 0;
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--amb-text);
    line-height: 1.5;
  }

  .reading-tension {
    margin: 0;
    font-family: var(--font-body);
    font-size: 12px;
    font-style: italic;
    color: var(--text-sec);
    line-height: 1.6;
    opacity: 0.8;
  }

  /* ── Animations ── */

  @keyframes pulse-glow {
    0%, 100% {
      opacity: 0.6;
      box-shadow: 0 0 6px rgba(121, 166, 163, 0.2);
    }
    50% {
      opacity: 1;
      box-shadow: 0 0 14px rgba(121, 166, 163, 0.5);
    }
  }

  @keyframes ring-expand {
    0% {
      transform: scale(0.5);
      opacity: 0.6;
    }
    80% {
      transform: scale(1.8);
      opacity: 0;
    }
    100% {
      transform: scale(1.8);
      opacity: 0;
    }
  }

  /* ── Responsive ── */

  @media (max-width: 900px) {
    .processing-shell.has-preview {
      grid-template-columns: 1fr;
      grid-template-rows: auto 1fr;
    }

    .preview-panel {
      max-height: 45dvh;
    }

    .preview-veil {
      background: linear-gradient(
        to bottom,
        transparent 60%,
        rgba(8, 9, 11, 0.7) 100%
      );
    }
  }
</style>
