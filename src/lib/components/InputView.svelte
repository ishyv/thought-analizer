<!--
  InputView.svelte
  Idle-state entry screen for submitting a thought into the extraction pipeline.

  Props:
    prefilledText    — restores this text into the textarea when it changes
    history          — HistoryEntry[], passed through to HistorySidebar
    onHistorySelect  — callback: restore a past query
    onHistoryRemove  — callback: remove a single entry
    onHistoryClear   — callback: clear all entries

  Emits:
    submit - { text: string }
-->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  import HistorySidebar from '$lib/components/HistorySidebar.svelte';
  import InputPresetRow from '$lib/components/input/InputPresetRow.svelte';
  import type { HistoryEntry } from '$lib/history';
  import { PRESET_POOL } from '$lib/samples/presets';

  const COPY = {
    appName: 'thought structure',
    buttonLabel: 'Analyze',
    guidance: 'works best with a sentence or short paragraph containing tension or conflict',
    placeholder: "What's on your mind?",
    tagline: 'Paste a thought. See its hidden structure.'
  } as const;

  /** If set, pre-populates the textarea with this text when it changes. */
  export let prefilledText: string = '';
  export let errorMessage: string = '';
  export let history: HistoryEntry[] = [];
  export let onHistorySelect: (text: string) => void = () => {};
  export let onHistoryRemove: (id: string) => void = () => {};
  export let onHistoryClear: () => void = () => {};

  const dispatch = createEventDispatcher<{ submit: { text: string } }>();

  // Pick 3 random presets once per component instantiation
  const presets = [...PRESET_POOL].sort(() => Math.random() - 0.5).slice(0, 3);

  let inputText = '';

  $: if (prefilledText) inputText = prefilledText;

  $: trimmedText = inputText.trim();
  $: canSubmit = trimmedText.length > 0;

  function handleSubmit(): void {
    if (!canSubmit) return;
    dispatch('submit', { text: trimmedText });
  }

  function handleKeydown(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      handleSubmit();
    }
  }

  function applyPreset(event: CustomEvent<{ text: string }>): void {
    inputText = event.detail.text;
  }
</script>

<section class="input-shell">
  {#if history.length > 0}
    <div class="history-slot">
      <HistorySidebar
        {history}
        onSelect={onHistorySelect}
        onRemove={onHistoryRemove}
        onClear={onHistoryClear}
      />
    </div>
  {/if}

  <div class="main-slot">
    <div class="main-col">
      <p class="eyebrow">{COPY.appName}</p>
      <p class="tagline">{COPY.tagline}</p>

      <div class="input-stack">
        <textarea
          bind:value={inputText}
          class="thought-input"
          placeholder={COPY.placeholder}
          rows="6"
          onkeydown={handleKeydown}
        ></textarea>

        <button class="submit-button" type="button" disabled={!canSubmit} onclick={handleSubmit}>
          {COPY.buttonLabel}
        </button>
      </div>

      <InputPresetRow {presets} on:choose={applyPreset} />

      <p class="guidance">{COPY.guidance}</p>

      {#if errorMessage}
        <p class="error-message" role="alert">{errorMessage}</p>
      {/if}
    </div>
  </div>
</section>

<style>
  .input-shell {
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: clamp(2rem, 7vw, 6rem);
    gap: 1.5rem;
    position: relative;
  }

  .history-slot {
    width: min(100%, 46rem);
  }

  .main-slot {
    width: 100%;
    display: flex;
    justify-content: center;
  }

  .main-col {
    width: min(100%, 46rem);
    min-width: 0;
    display: grid;
    gap: 1.25rem;
  }

  .eyebrow,
  .guidance,
  .submit-button {
    font-family: var(--font-mono);
    text-transform: uppercase;
  }

  .eyebrow {
    margin: 0;
    font-size: 0.72rem;
    letter-spacing: 0.18em;
    color: var(--text-pri);
  }

  .tagline {
    margin: 0;
    font-family: var(--font-body);
    font-size: clamp(1.4rem, 3vw, 2rem);
    font-style: italic;
    line-height: 1.25;
    color: var(--text-soft);
  }

  .input-stack {
    display: grid;
    gap: 0.9rem;
  }

  .thought-input {
    width: 100%;
    min-height: 12rem;
    resize: vertical;
    padding: 1rem 1.1rem;
    border: 1px solid var(--border);
    border-radius: 3px;
    background:
      linear-gradient(180deg, rgba(121, 166, 163, 0.05), transparent 22%),
      rgba(18, 21, 26, 0.82);
    color: var(--text-pri);
    font-family: var(--font-body);
    font-size: 1rem;
    line-height: 1.65;
    outline: none;
    transition:
      border-color var(--transition-fast),
      box-shadow var(--transition-fast),
      background var(--transition-fast);
  }

  .thought-input::placeholder {
    color: var(--text-muted);
  }

  .thought-input:focus-visible {
    border-color: var(--border-hi);
    box-shadow: 0 0 0 1px var(--border-hi);
  }

  .submit-button {
    justify-self: start;
    padding: 0.55rem 0.8rem;
    border: 1px solid var(--pos-border);
    border-radius: 3px;
    background: rgba(121, 166, 163, 0.08);
    color: var(--pos-text);
    font-size: 0.72rem;
    letter-spacing: 0.14em;
    cursor: pointer;
    transition:
      transform var(--transition-smooth),
      border-color var(--transition-fast),
      color var(--transition-fast),
      background var(--transition-fast);
  }

  .submit-button:hover:enabled,
  .submit-button:focus-visible:enabled {
    transform: translateY(-1px);
    border-color: var(--signal);
    background: rgba(121, 166, 163, 0.14);
    outline: none;
  }

  .submit-button:disabled {
    border-color: var(--border);
    background: rgba(18, 21, 26, 0.6);
    color: var(--text-muted);
    cursor: not-allowed;
  }

  .guidance {
    margin: 0;
    font-size: 0.62rem;
    letter-spacing: 0.1em;
    color: var(--text-muted);
  }

  .error-message {
    margin: 0;
    color: var(--neg-text);
    font-family: var(--font-mono);
    font-size: 0.72rem;
    line-height: 1.5;
  }

  @media (min-width: 1200px) {
    .input-shell {
      gap: 0;
    }

    .history-slot {
      position: absolute;
      left: clamp(1.5rem, 4vw, 4rem);
      top: 50%;
      width: 220px;
      transform: translateY(-50%);
    }
  }

  @media (max-width: 767px) {
    .input-shell {
      justify-content: flex-start;
    }
  }
</style>
