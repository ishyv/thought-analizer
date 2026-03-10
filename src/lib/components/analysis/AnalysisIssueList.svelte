<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  import type { SelectionDetail } from '$lib/components/analysis/helpers';
  import { filterState, type ActiveSet, type FilterState, type SelectableKind } from '$lib/stores';
  import type { Issue } from '$lib/types';

  function isIssueFilteredOut(issue: Issue, fs: FilterState): boolean {
    return fs.issueTypes.size > 0 && !fs.issueTypes.has(issue.type);
  }

  export let featuredIssue: Issue | null;
  export let issues: Issue[];
  export let activeSet: ActiveSet;
  export let hasSelection: boolean;

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
</script>

{#if featuredIssue}
  {@const isActive = activeSet.issueIds.has(featuredIssue.id)}
  {@const filtered = isIssueFilteredOut(featuredIssue, $filterState)}
  {@const dim = filtered || (hasSelection && !isActive)}
  <button
    type="button"
    class="issue-card feature-card"
    style="
      border-color: {isActive ? 'var(--amb-border)' : 'var(--border-hi)'};
      background: {isActive ? 'var(--amb-bg)' : 'var(--surface)'};
      opacity: {filtered ? 0.15 : dim ? 0.2 : 1};
    "
    onclick={() => emitSelect(featuredIssue.id, 'issue')}
    onmouseenter={() => emitHover(featuredIssue.id, 'issue')}
    onmouseleave={emitLeave}
  >
    <div class="issue-header">
      <span class="tag" style="background: var(--amb-tag); color: var(--amb-text); border: 1px solid var(--amb-border);">
        {featuredIssue.type.replace(/_/g, ' ')}
      </span>
      {#if featuredIssue.confidence}
        <span class="confidence">{featuredIssue.confidence}</span>
      {/if}
    </div>
    <p class="serif m-0 leading-relaxed" style="font-size: 12px; color: var(--text-pri);">
      {featuredIssue.label}
    </p>
  </button>
{/if}

{#each issues as issue}
  {@const isActive = activeSet.issueIds.has(issue.id)}
  {@const filtered = isIssueFilteredOut(issue, $filterState)}
  {@const dim = filtered || (hasSelection && !isActive)}
  <button
    type="button"
    class="issue-card"
    style="
      border-color: {isActive ? 'var(--amb-border)' : 'var(--border)'};
      background: {isActive ? 'var(--amb-bg)' : 'var(--surface)'};
      opacity: {filtered ? 0.15 : dim ? 0.2 : 1};
    "
    onclick={() => emitSelect(issue.id, 'issue')}
    onmouseenter={() => emitHover(issue.id, 'issue')}
    onmouseleave={emitLeave}
  >
    <div class="issue-header">
      <span class="tag" style="background: var(--amb-tag); color: var(--amb-text); border: 1px solid var(--amb-border);">
        {issue.type.replace(/_/g, ' ')}
      </span>
      {#if issue.confidence}
        <span class="confidence">{issue.confidence}</span>
      {/if}
    </div>
    <p class="serif m-0 leading-relaxed" style="font-size: 12px; color: {isActive ? 'var(--text-pri)' : 'var(--text-sec)'};">
      {issue.label}
    </p>
  </button>
{/each}

<style>
  .serif {
    font-family: var(--font-body);
  }

  .issue-card {
    width: 100%;
    margin-top: 0.6rem;
    padding: 10px 12px;
    border: 1px solid var(--border);
    border-radius: 3px;
    text-align: left;
    appearance: none;
    background: var(--surface);
    cursor: pointer;
    transition:
      transform var(--transition-smooth),
      opacity var(--transition-fast),
      border-color var(--transition-fast),
      background var(--transition-fast),
      box-shadow var(--transition-fast);
  }

  .issue-card:hover {
    transform: translateX(6px);
  }

  .feature-card {
    margin-top: 0;
    box-shadow: inset 0 0 0 1px var(--amb-border);
  }

  .issue-header {
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.375rem;
  }

  .tag,
  .confidence {
    font-family: var(--font-mono);
    text-transform: uppercase;
  }

  .tag {
    display: inline-block;
    font-size: 9px;
    letter-spacing: 0.08em;
    padding: 1px 5px;
    border-radius: 2px;
    line-height: 16px;
    white-space: nowrap;
  }

  .confidence {
    font-size: 8px;
    color: var(--text-muted);
    letter-spacing: 0.1em;
  }
</style>
