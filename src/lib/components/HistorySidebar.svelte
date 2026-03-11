<!--
  HistorySidebar.svelte
  Displays recent query history from localStorage.
  Rendered on the left of the input page on desktop.
  Hidden on narrow viewports (< 768px).

  Props:
    history  — HistoryEntry[], newest first
    onSelect — callback when a history item is clicked (restores text)
    onRemove — callback when a history item is deleted
    onClear  — callback when "clear all" is triggered

  This component is purely presentational — it owns no state.
  The parent (+page.svelte) manages the history array.
-->
<script lang="ts">
  import type { HistoryEntry } from '$lib/history';
  import { formatRelativeTime } from '$lib/utils/time';

  export let history: HistoryEntry[] = [];
  export let onSelect: (text: string) => void;
  export let onRemove: (id: string) => void;
  export let onClear: () => void;
</script>

<aside class="sidebar">
  <div class="sidebar-header">
    <span class="label">RECENT</span>
    {#if history.length > 0}
      <button class="clear-btn" type="button" onclick={onClear}>clear</button>
    {/if}
  </div>

  {#if history.length === 0}
    <p class="empty-state">No recent queries</p>
  {:else}
    <ul class="entry-list">
      {#each history as entry (entry.id)}
        <li class="entry-row">
          <button
            class="entry-btn"
            type="button"
            onclick={() => onSelect(entry.text)}
          >
            <span class="entry-text">{entry.text}</span>
            <span class="entry-time">{formatRelativeTime(entry.savedAt)}</span>
          </button>
          <button
            class="remove-btn"
            type="button"
            aria-label="Remove"
            onclick={(e) => { e.stopPropagation(); onRemove(entry.id); }}
          >×</button>
        </li>
      {/each}
    </ul>
  {/if}
</aside>

<style>
  .sidebar {
    width: 220px;
    flex-shrink: 0;
    height: 100%;
    border-right: 1px solid var(--border);
    background: var(--surface);
    padding: 20px 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    overflow: hidden;
  }

  .sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .label {
    font-family: var(--font-mono);
    font-size: 9px;
    letter-spacing: 0.15em;
    color: var(--text-sec);
  }

  .clear-btn {
    font-family: var(--font-mono);
    font-size: 9px;
    color: var(--text-muted);
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
  }

  .clear-btn:hover {
    color: var(--text-sec);
  }

  .empty-state {
    font-family: var(--font-mono);
    font-size: 9px;
    color: var(--text-muted);
    text-align: center;
    margin: 0;
    padding-top: 8px;
  }

  .entry-list {
    list-style: none;
    margin: 0;
    padding: 0;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .entry-row {
    position: relative;
    display: flex;
    align-items: stretch;
    border-radius: 3px;
  }

  .entry-row:hover {
    background: var(--bg);
  }

  .entry-row:hover .remove-btn {
    opacity: 1;
  }

  .entry-btn {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 3px;
    padding: 8px 24px 8px 10px;
    background: none;
    border: none;
    cursor: pointer;
    text-align: left;
  }

  .entry-text {
    font-family: var(--font-body);
    font-size: 12px;
    color: var(--text-sec);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
    display: block;
  }

  .entry-row:hover .entry-text {
    color: var(--text-pri);
  }

  .entry-time {
    font-family: var(--font-mono);
    font-size: 8px;
    color: var(--text-muted);
  }

  .remove-btn {
    position: absolute;
    right: 6px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: var(--text-muted);
    font-size: 12px;
    line-height: 1;
    padding: 2px 3px;
    cursor: pointer;
    opacity: 0;
    transition: color var(--transition-fast), opacity var(--transition-fast);
  }

  .remove-btn:hover {
    color: var(--text-sec);
  }

  @media (max-width: 767px) {
    .sidebar {
      width: 100%;
      height: auto;
      border-right: none;
      padding: 0;
      background: none;
    }
  }
</style>
