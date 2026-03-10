<!--
  ProcessingView.svelte
  Transitional loading state shown between input submission and validated analysis output.

  Props:
    inputText - the user-submitted thought currently being processed
-->
<script lang="ts">
  const COPY = {
    ariaLabel: 'Processing'
  } as const;

  export let inputText: string;
</script>

<section class="processing-shell" aria-label={COPY.ariaLabel}>
  <div class="processing-card">
    <p class="echo">{inputText}</p>

    <div class="dot-row" aria-hidden="true">
      <span class="dot dot-one"></span>
      <span class="dot dot-two"></span>
      <span class="dot dot-three"></span>
    </div>
  </div>
</section>

<style>
  .processing-shell {
    min-height: 100dvh;
    display: grid;
    place-items: center;
    padding: clamp(2rem, 7vw, 6rem);
  }

  .processing-card {
    width: min(100%, 40rem);
    display: grid;
    gap: 1.5rem;
    justify-items: center;
  }

  .echo {
    margin: 0;
    color: var(--text-sec);
    font-family: var(--font-body);
    font-size: clamp(1rem, 2.2vw, 1.2rem);
    font-style: italic;
    line-height: 1.7;
    text-align: center;
    opacity: 0.75;
  }

  .dot-row {
    display: inline-flex;
    gap: 0.5rem;
  }

  .dot {
    width: 0.4rem;
    height: 0.4rem;
    border-radius: 999px;
    background: var(--text-muted);
    animation: pulse 1.2s ease-in-out infinite;
  }

  .dot-two {
    animation-delay: 0.16s;
  }

  .dot-three {
    animation-delay: 0.32s;
  }

  @keyframes pulse {
    0%,
    80%,
    100% {
      opacity: 0.2;
      transform: translateY(0);
    }

    40% {
      opacity: 1;
      transform: translateY(-1px);
    }
  }
</style>
