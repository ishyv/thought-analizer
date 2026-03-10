<script lang="ts">
  import { cn } from '$lib/utils/cn';

  let { class: className = '', children } = $props();
</script>

<div class={cn('mx-auto w-full max-w-5xl px-6 sm:px-8 lg:px-10', className)}>
  {@render children?.()}
</div>
