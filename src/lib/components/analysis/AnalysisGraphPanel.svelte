<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  import GraphLegend from '$lib/components/analysis/GraphLegend.svelte';
  import {
    buildGraphPath,
    edgeColor,
    edgeLabelPosition,
    roleVar,
    type SelectionDetail
  } from '$lib/components/analysis/helpers';
  import type { GraphLayout } from '$lib/graph';
  import type { ActiveSet, SelectionState, SelectableKind } from '$lib/stores';

  export let selectionState: SelectionState;
  export let activeSet: ActiveSet;
  export let layout: GraphLayout;

  const dispatch = createEventDispatcher<{
    hover: SelectionDetail;
    select: SelectionDetail;
    leave: void;
  }>();

  const RELATION_MARKERS = [
    ['blocks', 'var(--rel-blocks)'],
    ['supports', 'var(--rel-supports)'],
    ['leads_to', 'var(--rel-leads-to)'],
    ['contrasts_with', 'var(--rel-contrasts-with)']
  ] as const;

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
  $: graphWidth = layout.width > 0 ? layout.width : 240;
  $: graphHeight = layout.height > 0 ? layout.height : 140;
</script>

<section class="panel overflow-y-auto p-7">
  <div class="panel-inner flex flex-col gap-5">
    <div class="divider-row">
      <span class="divider-label">structure</span>
      <div class="divider-line"></div>
    </div>

    <svg width="100%" viewBox={`0 0 ${graphWidth} ${graphHeight}`} style="overflow: visible;">
      <defs>
        {#each RELATION_MARKERS as [type, color]}
          <marker id={`arrow-${type}`} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L0,6 L6,3 z" fill={color} opacity="0.7" />
          </marker>
        {/each}
      </defs>

      {#each layout.edges as edge}
        {@const isActive = activeSet.relationIds.has(edge.id)}
        {@const dim = hasSelection && !isActive}
        {@const path = buildGraphPath(edge.points)}
        {@const labelPos = edgeLabelPosition(edge.points)}
        {@const color = edgeColor(edge.type)}
        {@const dashArray = edge.type === 'contrasts_with' ? '3 3' : undefined}
        {#if path}
          <g
            class="graph-edge"
            role="button"
            tabindex="0"
            aria-label={`relation ${edge.type.replace(/_/g, ' ')}`}
            style="opacity: {dim ? 0.06 : isActive ? 1 : 0.3};"
            onclick={() => emitSelect(edge.id, 'relation')}
            onmouseenter={() => emitHover(edge.id, 'relation')}
            onmouseleave={emitLeave}
            onkeydown={(event) => handleKeydown(event, { id: edge.id, kind: 'relation' })}
          >
            <path d={path} fill="none" stroke="transparent" stroke-width="12" />
            <path
              d={path}
              fill="none"
              stroke={color}
              stroke-width={isActive ? 1.5 : 1}
              marker-end={`url(#arrow-${edge.type})`}
              stroke-dasharray={dashArray}
            />
            {#if isActive}
              <text x={labelPos.x} y={labelPos.y} text-anchor="middle" fill={color} font-size="8" font-family="IBM Plex Mono, monospace" letter-spacing="0.08em">
                {edge.type.replace(/_/g, ' ')}
              </text>
            {/if}
          </g>
        {/if}
      {/each}

      {#each layout.nodes as node}
        {@const role = roleVar(node.role)}
        {@const isActive = activeSet.statementIds.has(node.id)}
        {@const isSelected =
          selectionState.selectedId === node.id && selectionState.selectedKind === 'statement'}
        {@const dim = hasSelection && !isActive}
        <g
          class="graph-node"
          role="button"
          tabindex="0"
          aria-label={`statement ${node.label}`}
          style="opacity: {dim ? 0.12 : 1};"
          onclick={() => emitSelect(node.id, 'statement')}
          onmouseenter={() => emitHover(node.id, 'statement')}
          onmouseleave={emitLeave}
          onkeydown={(event) => handleKeydown(event, { id: node.id, kind: 'statement' })}
        >
          <rect
            x={node.x}
            y={node.y}
            width={node.width}
            height={node.height}
            rx="3"
            fill={isActive ? `var(--${role}-bg)` : 'var(--surface)'}
            stroke={isActive ? `var(--${role}-border)` : 'var(--border)'}
            stroke-width={isSelected ? 2 : 1}
          />
          <text x={node.x + 10} y={node.y + 13} fill={`var(--${role}-text)`} font-size="7.5" font-family="IBM Plex Mono, monospace" letter-spacing="0.1em">
            {node.role.toUpperCase()}
          </text>
          <text x={node.x + 10} y={node.y + 30} fill={isActive ? 'var(--text-pri)' : 'var(--text-sec)'} font-size="10" font-family="Lora, Georgia, serif">
            {node.label}
          </text>
        </g>
      {/each}
    </svg>

    <GraphLegend />
  </div>
</section>

<style>
  .panel {
    background: rgba(8, 9, 11, 0.8);
    position: relative;
  }

  .panel::before {
    content: '';
    position: absolute;
    inset: 0.9rem;
    border: 1px solid rgba(121, 166, 163, 0.12);
    pointer-events: none;
    opacity: 0.4;
  }

  .panel-inner {
    position: relative;
    z-index: 1;
  }

  .graph-node,
  .graph-edge {
    cursor: pointer;
    transition: opacity var(--transition-fast);
  }

  .divider-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .divider-line {
    flex: 1;
    height: 1px;
    background: var(--border);
  }

  .divider-label {
    font-family: var(--font-mono);
    font-size: 9px;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--text-sec);
  }
</style>
