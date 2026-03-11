<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  import { roleVar, type SelectionDetail } from '$lib/components/analysis/helpers';
  import { filterState, type ActiveSet, type FilterState, type SelectionState, type SelectableKind } from '$lib/stores';
  import type { PhraseGroup, StatementGroup } from '$lib/types';

  /** A statement is filtered out when all its linked phrases fail the active filter. */
  function isStatementFilteredOut(stmt: StatementGroup, phrases: Map<string, PhraseGroup>, fs: FilterState): boolean {
    if (fs.polarities.size === 0 && fs.phraseTypes.size === 0) return false;
    return stmt.phrase_ids.every((pid) => {
      const p = phrases.get(pid);
      if (!p) return true;
      if (fs.polarities.size > 0 && !fs.polarities.has(p.polarity)) return true;
      if (fs.phraseTypes.size > 0 && !fs.phraseTypes.has(p.type)) return true;
      return false;
    });
  }

  export let statements: StatementGroup[];
  export let phraseGroups: PhraseGroup[];
  export let selectionState: SelectionState;
  export let activeSet: ActiveSet;

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

  $: phraseMap = new Map(phraseGroups.map((p) => [p.id, p]));
  $: hasSelection = Boolean(selectionState.selectedId);
</script>

{#each statements as statement}
  {@const role = roleVar(statement.role)}
  {@const isActive = activeSet.statementIds.has(statement.id)}
  {@const isSelected =
    selectionState.selectedId === statement.id && selectionState.selectedKind === 'statement'}
  {@const filtered = isStatementFilteredOut(statement, phraseMap, $filterState)}
  {@const dim = filtered || (hasSelection && !isActive)}
  <button
    type="button"
    class="statement-strip"
    class:collapsed={dim}
    style="
      border-color: {isActive ? `var(--${role}-border)` : 'var(--border)'};
      background: {isActive ? `var(--${role}-bg)` : 'var(--surface)'};
      opacity: {filtered ? 0.15 : dim ? 0.35 : 1};
      box-shadow: {isSelected ? `inset 0 0 0 1px var(--${role}-border)` : 'none'};
    "
    onclick={() => emitSelect(statement.id, 'statement')}
    onmouseenter={() => emitHover(statement.id, 'statement')}
    onmouseleave={emitLeave}
  >
    <span
      class="tag"
      style="
        background: var(--{role}-bg);
        color: var(--{role}-text);
        border: 1px solid var(--{role}-border);
      "
    >
      {statement.role}
    </span>
    <span
      class="serif flex-1"
      style="font-size: 12px; color: {isActive ? 'var(--text-pri)' : 'var(--text-sec)'}; word-wrap: break-word; overflow-wrap: break-word; line-height: 1.5;"
    >
      {statement.text}
    </span>
  </button>
{/each}

<style>
  .serif {
    font-family: var(--font-body);
  }

  .statement-strip {
    width: 100%;
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 8px 10px;
    border: 1px solid var(--border);
    border-radius: 3px;
    text-align: left;
    appearance: none;
    background: var(--surface);
    cursor: pointer;
    transition:
      transform var(--transition-smooth),
      opacity 0.15s ease,
      border-color var(--transition-fast),
      background var(--transition-fast),
      box-shadow var(--transition-fast);
  }

  .statement-strip.collapsed {
    opacity: 0.35;
  }

  .statement-strip:hover {
    transform: translateX(4px);
    border-left: 1px solid var(--line-strong);
    background:
      linear-gradient(90deg, rgba(199, 156, 87, 0.06), transparent 60%),
      var(--surface);
  }

  .tag {
    display: inline-block;
    font-family: var(--font-mono);
    font-size: 9px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 1px 5px;
    border-radius: 2px;
    line-height: 16px;
    white-space: nowrap;
    margin-top: 1px;
    flex-shrink: 0;
  }
</style>
