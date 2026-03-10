<script lang="ts">
  const LEGEND_ENTRIES: Array<{ label: string; color: string; dashArray?: string }> = [
    { label: 'blocks', color: 'var(--rel-blocks)' },
    { label: 'supports', color: 'var(--rel-supports)' },
    { label: 'leads to', color: 'var(--rel-leads-to)' },
    { label: 'contrasts with', color: 'var(--rel-contrasts-with)', dashArray: '3 2' }
  ];
</script>

<div class="legend-row">
  {#each LEGEND_ENTRIES as entry}
    <div class="legend-item">
      <svg width="16" height="8" style="overflow: visible;">
        <line
          x1="0"
          y1="4"
          x2="16"
          y2="4"
          stroke={entry.color}
          stroke-width="1"
          opacity="0.6"
          stroke-dasharray={entry.dashArray}
        />
      </svg>
      <span class="legend-label">{entry.label}</span>
    </div>
  {/each}
</div>

<style>
  .legend-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.375rem;
  }

  .legend-label {
    font-family: var(--font-mono);
    font-size: 8px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-sec);
  }
</style>
