<script lang="ts">
  import '../app.css';
  import favicon from '$lib/assets/favicon.svg';

  let { children } = $props();
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
  <title>thought-structure</title>
  <meta
    name="description"
    content="A static thought-structure prototype for reading phrase highlights, statement roles, relations, and tensions."
  />
</svelte:head>

<main>
  {@render children?.()}
</main>
