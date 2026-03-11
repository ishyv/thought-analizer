<!--
  HistoryStrip.svelte
  Faded inline list of recent queries. No chrome — just text.
  Only rendered when history is non-empty.

  Props:
    history  — HistoryEntry[], newest first (caller passes full list; shows up to 5)
    onSelect — restore text into textarea
    onRemove — delete a single entry
    onClear  — delete all entries
-->
<script lang="ts">
  import type { HistoryEntry } from '$lib/history';

  export let history: HistoryEntry[];
  export let onSelect: (text: string) => void;
  export let onRemove: (id: string) => void;
  export let onClear: () => void;

  $: visible = history.slice(0, 5);
</script>

<div class="strip">
  <div class="strip-head">
    <span class="strip-label">recent</span>
    <button class="strip-clear" type="button" onclick={onClear}>clear</button>
  </div>

  <ul class="strip-list">
    {#each visible as entry (entry.id)}
      <li class="strip-row">
        <button class="strip-btn" type="button" onclick={() => onSelect(entry.text)}>
          {entry.text}
        </button>
        <button
          class="strip-remove"
          type="button"
          aria-label="Remove"
          onclick={(e) => { e.stopPropagation(); onRemove(entry.id); }}
        >×</button>
      </li>
    {/each}
  </ul>
</div>

<style>
  .strip {
    width: 140px;
    flex-shrink: 0;
    padding-top: 0.1rem;
    display: grid;
    gap: 0.35rem;
  }

  .strip-head {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .strip-label {
    font-family: var(--font-mono);
    font-size: 0.6rem;
    letter-spacing: 0.16em;
    color: var(--text-sec);
    opacity: 0.5;
    text-transform: uppercase;
  }

  .strip-clear {
    font-family: var(--font-mono);
    font-size: 0.6rem;
    letter-spacing: 0.1em;
    color: var(--text-muted);
    opacity: 0;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    transition: opacity var(--transition-fast), color var(--transition-fast);
  }

  .strip:hover .strip-clear {
    opacity: 0.5;
  }

  .strip-clear:hover {
    opacity: 0.85 !important;
    color: var(--text-sec);
  }

  .strip-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .strip-row {
    display: flex;
    align-items: center;
    position: relative;
  }

  .strip-btn {
    flex: 1;
    min-width: 0;
    background: none;
    border: none;
    padding: 0.22rem 1.2rem 0.22rem 0;
    text-align: left;
    font-family: var(--font-body);
    font-size: 0.73rem;
    font-style: italic;
    color: var(--text-sec);
    opacity: 0.55;
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    transition: color var(--transition-fast), opacity var(--transition-fast);
  }

  .strip-row:hover .strip-btn {
    color: var(--text-pri);
    opacity: 1;
  }

  .strip-remove {
    position: absolute;
    right: 0;
    background: none;
    border: none;
    padding: 0 2px;
    font-size: 0.7rem;
    line-height: 1;
    color: var(--text-muted);
    opacity: 0;
    cursor: pointer;
    transition: opacity var(--transition-fast), color var(--transition-fast);
  }

  .strip-row:hover .strip-remove {
    opacity: 0.5;
  }

  .strip-remove:hover {
    opacity: 0.9 !important;
    color: var(--text-sec);
  }

  @media (max-width: 767px) {
    .strip {
      display: none;
    }
  }
</style>
