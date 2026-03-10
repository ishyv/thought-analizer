<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let presets: string[];

  const dispatch = createEventDispatcher<{ choose: { text: string } }>();

  function handleChoose(text: string): void {
    dispatch('choose', { text });
  }
</script>

<div class="preset-row">
  {#each presets as preset}
    <button class="preset-chip" type="button" onclick={() => handleChoose(preset)}>
      {preset}
    </button>
  {/each}
</div>

<style>
  .preset-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .preset-chip {
    max-width: 100%;
    padding: 0.35rem 0.5rem;
    border: 1px solid var(--border);
    border-radius: 999px;
    background: rgba(18, 21, 26, 0.72);
    color: var(--text-sec);
    font-family: var(--font-mono);
    font-size: 0.62rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    text-align: left;
    cursor: pointer;
    transition:
      border-color var(--transition-fast),
      color var(--transition-fast),
      transform var(--transition-smooth);
  }

  .preset-chip:hover,
  .preset-chip:focus-visible {
    border-color: var(--border-hi);
    color: var(--text-pri);
    transform: translateY(-1px);
    outline: none;
  }
</style>
