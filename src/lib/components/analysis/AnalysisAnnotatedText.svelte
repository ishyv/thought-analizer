<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  import type { AnnotatedSpan, SelectionDetail } from '$lib/components/analysis/helpers';
  import { polarityVar } from '$lib/components/analysis/helpers';
  import { filterState, type ActiveSet, type FilterState, type SelectionState, type SelectableKind } from '$lib/stores';

  export let spans: AnnotatedSpan[];
  export let selectionState: SelectionState;
  export let activeSet: ActiveSet;

  function isFilteredOut(phrase: AnnotatedSpan['phrase'], fs: FilterState): boolean {
    if (!phrase) return false;
    if (fs.polarities.size > 0 && !fs.polarities.has(phrase.polarity)) return true;
    if (fs.phraseTypes.size > 0 && !fs.phraseTypes.has(phrase.type)) return true;
    return false;
  }

  const dispatch = createEventDispatcher<{
    hover: SelectionDetail;
    select: SelectionDetail;
    leave: void;
  }>();

  function emitSelect(id: string, kind: SelectableKind): void {
    dispatch('select', { id, kind });
  }

  function emitHover(id: string, kind: SelectableKind): void {
    dispatch('hover', { id, kind });
  }

  function emitLeave(): void {
    dispatch('leave');
  }

  function handleKeydown(event: KeyboardEvent, detail: SelectionDetail): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      emitSelect(detail.id, detail.kind);
    }
  }

  $: hasSelection = Boolean(selectionState.selectedId);
</script>

<p class="serif m-0 leading-loose" style="font-size: 15px; color: var(--text-pri); letter-spacing: 0.01em;">
  {#each spans as span}
    {#if !span.phrase}
      <span
        style="color: {hasSelection ? 'var(--text-muted)' : 'var(--text-pri)'}; transition: color var(--transition-fast);"
      >
        {span.text}
      </span>
    {:else}
      {@const phrase = span.phrase}
      {@const polarity = polarityVar(phrase.polarity)}
      {@const isActive = activeSet.phraseIds.has(phrase.id)}
      {@const isSelected =
        selectionState.selectedId === phrase.id && selectionState.selectedKind === 'phrase'}
      {@const filtered = isFilteredOut(phrase, $filterState)}
      {@const dim = filtered || (hasSelection && !isActive)}
      <span class="phrase-wrapper">
        <span
          class="phrase-tag"
          style="border-color: var(--{polarity}-border); background: var(--{polarity}-tag); color: var(--{polarity}-text);"
        >
          <span class="tag-dot" style="background: var(--{polarity}-text);"></span>
          <span class="phrase-tag-label">{phrase.concept_label}</span>
        </span>
        <span
          class="phrase-span"
          role="button"
          tabindex="0"
          title={`${phrase.type.replace(/_/g, ' ')} · ${phrase.polarity}`}
          style="
            background: {isActive ? `var(--${polarity}-bg)` : 'transparent'};
            border-bottom-color: {isActive ? `var(--${polarity}-border)` : 'transparent'};
            color: {dim ? 'var(--text-muted)' : isActive ? `var(--${polarity}-text)` : 'var(--text-pri)'};
            box-shadow: {isSelected ? `0 0 0 1px var(--${polarity}-border)` : 'none'};
            opacity: {filtered ? 0.15 : dim ? 0.45 : 1};
          "
          onclick={() => emitSelect(phrase.id, 'phrase')}
          onmouseenter={() => emitHover(phrase.id, 'phrase')}
          onmouseleave={emitLeave}
          onkeydown={(event) => handleKeydown(event, { id: phrase.id, kind: 'phrase' })}
        >
          {span.text}
        </span>
      </span>
    {/if}
  {/each}
</p>

<style>
  .serif {
    font-family: var(--font-body);
  }

  .phrase-wrapper {
    position: relative;
    display: inline;
  }

  .phrase-span {
    cursor: pointer;
    border-radius: 2px;
    padding: 1px 2px;
    border-bottom: 2px solid transparent;
    transition:
      color var(--transition-fast),
      background var(--transition-fast),
      border-color var(--transition-fast),
      box-shadow var(--transition-fast),
      opacity var(--transition-fast);
  }

  .phrase-tag {
    position: absolute;
    left: 0;
    bottom: calc(100% + 0.25rem);
    z-index: 3;
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    max-width: 160px;
    padding: 0.15rem 0.35rem;
    border: 1px solid var(--border);
    border-radius: 2px;
    box-shadow: var(--shadow-veil);
    opacity: 0;
    pointer-events: none;
    transform: translateY(2px);
    transition:
      opacity var(--transition-fast),
      transform var(--transition-fast);
  }

  .phrase-wrapper:hover .phrase-tag,
  .phrase-wrapper:focus-within .phrase-tag {
    opacity: 1;
    transform: translateY(0);
  }

  .tag-dot {
    width: 5px;
    height: 5px;
    border-radius: 999px;
    flex: none;
  }

  .phrase-tag-label {
    font-family: var(--font-mono);
    font-size: 8px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
