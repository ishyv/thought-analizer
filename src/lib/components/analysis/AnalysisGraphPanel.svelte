<script lang="ts">
  import { createEventDispatcher, onMount, tick } from 'svelte';

  import panzoom, { type PanZoom } from 'panzoom';

  import GraphLegend from '$lib/components/analysis/GraphLegend.svelte';
  import {
    buildGraphPath,
    edgeColor,
    edgeLabelPosition
  } from '$lib/components/analysis/graph-helpers';
  import { roleVar, type SelectionDetail } from '$lib/components/analysis/helpers';
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

  let containerEl: HTMLDivElement;
  let pz: PanZoom;
  let mounted = false;

  function getContainerSize(): { w: number; h: number } {
    if (!containerEl) return { w: 0, h: 0 };
    return { w: containerEl.clientWidth, h: containerEl.clientHeight };
  }

  function centerGraph() {
    if (!pz) return;
    const { w, h } = getContainerSize();
    if (w === 0 || h === 0) return;

    // Fit the graph inside the container with some padding
    const scaleX = w / (graphWidth + 40);
    const scaleY = h / (graphHeight + 40);
    const fitZoom = Math.min(scaleX, scaleY, 1.0); // never zoom in beyond 1x

    const dx = (w - graphWidth * fitZoom) / 2;
    const dy = (h - graphHeight * fitZoom) / 2;

    pz.zoomAbs(0, 0, fitZoom);
    pz.moveTo(dx, dy);
  }

  function centerGraphSmooth() {
    if (!pz) return;
    const { w, h } = getContainerSize();
    if (w === 0 || h === 0) return;

    const scaleX = w / (graphWidth + 40);
    const scaleY = h / (graphHeight + 40);
    const fitZoom = Math.min(scaleX, scaleY, 1.0);

    const dx = (w - graphWidth * fitZoom) / 2;
    const dy = (h - graphHeight * fitZoom) / 2;

    pz.smoothZoomAbs(0, 0, fitZoom);
    pz.smoothMoveTo(dx, dy);
  }

  function focusNode(nodeId: string) {
    if (!pz) return;
    const node = layout.nodes.find(n => n.id === nodeId);
    if (!node) return;
    const { w, h } = getContainerSize();
    if (w === 0 || h === 0) return;

    const nodeCenterX = node.x + node.width / 2;
    const nodeCenterY = node.y + node.height / 2;
    const zoom = pz.getTransform().scale;
    const dx = (w / 2) - (nodeCenterX * zoom);
    const dy = (h / 2) - (nodeCenterY * zoom);

    pz.smoothMoveTo(dx, dy);
  }

  function setupPanzoom(node: SVGGElement) {
    pz = panzoom(node, {
      maxZoom: 4,
      minZoom: 0.15,
      zoomDoubleClickSpeed: 1,
      smoothScroll: false
    });

    // Initial center after first paint
    if (mounted) {
      requestAnimationFrame(centerGraph);
    }

    return {
      destroy() {
        pz.dispose();
      }
    };
  }

  onMount(async () => {
    mounted = true;
    await tick();
    // If pz was already created by the action, center now
    if (pz) {
      requestAnimationFrame(centerGraph);
    }
  });

  // Re-center when the layout changes (new analysis)
  let lastLayoutId = '';
  $: if (mounted && pz && layout && layout.nodes.length > 0) {
    const currentId = layout.nodes.map(n => n.id).join(',');
    if (currentId !== lastLayoutId) {
      lastLayoutId = currentId;
      // Wait for Svelte to render the new nodes, then center
      tick().then(() => requestAnimationFrame(centerGraph));
    }
  }

  // Focus on selected statement node (only when user explicitly selects)
  let lastSelectedId = '';
  $: if (mounted && pz && selectionState.selectedId && selectionState.selectedKind === 'statement') {
    if (selectionState.selectedId !== lastSelectedId) {
      lastSelectedId = selectionState.selectedId;
      focusNode(selectionState.selectedId);
    }
  }
  // Reset tracking when deselected
  $: if (!selectionState.selectedId) {
    lastSelectedId = '';
  }
</script>

<section class="panel p-7">
  <div class="panel-inner flex flex-col gap-5 h-full min-h-full">
    <div class="divider-row">
      <span class="divider-label">structure</span>
      <div class="divider-line"></div>
    </div>

    <div class="graph-container" bind:this={containerEl}>
      <svg class="graph-svg">
        <defs>
          {#each RELATION_MARKERS as [type, color]}
            <marker id={`arrow-${type}`} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M0,0 L0,6 L6,3 z" fill={color} opacity="0.7" />
            </marker>
          {/each}
        </defs>

        <g use:setupPanzoom>
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
        </g>
      </svg>

      <!-- Recenter button — always visible inside the graph container -->
      <button class="recenter-fab" aria-label="Recenter graph" onclick={centerGraphSmooth} title="Recenter graph">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M12 2v4M12 18v4M2 12h4M18 12h4"></path>
        </svg>
      </button>
    </div>

    <GraphLegend />
  </div>
</section>

<style>
  .panel {
    background: rgba(8, 9, 11, 0.8);
    position: relative;
    height: calc(100dvh - 49px);
    overflow: hidden;
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

  .graph-container {
    flex: 1;
    position: relative;
    overflow: hidden;
    min-height: 300px;
  }

  .graph-svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: visible;
    touch-action: none;
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

  .recenter-fab {
    position: absolute;
    bottom: 12px;
    right: 12px;
    width: 30px;
    height: 30px;
    border-radius: 4px;
    border: 1px solid var(--border);
    background: rgba(10, 12, 15, 0.85);
    color: var(--text-sec);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.15s ease;
    z-index: 10;
  }

  .recenter-fab:hover {
    color: var(--text-pri);
    border-color: var(--text-sec);
    background: rgba(121, 166, 163, 0.15);
  }
</style>
