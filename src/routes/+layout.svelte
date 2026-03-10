<script lang="ts">
  import '../app.css';

  let { children } = $props();

  const title = 'Thought Structure';
  const description =
    'Paste a thought and see its hidden structure through phrase highlights, relationships, tensions, and reasoning cues.';
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <meta
    name="keywords"
    content="thought structure, reasoning analysis, idea mapping, semantic analysis, SvelteKit"
  />
  <meta name="robots" content="index, follow" />
  <meta name="theme-color" content="#f5f1e8" />

  <link rel="icon" href="/favicon.ico" sizes="any" />
  <link rel="icon" type="image/png" href="/nobg_hyvnt.png" />
  <link rel="apple-touch-icon" href="/nobg_hyvnt.png" />

  <meta property="og:type" content="website" />
  <meta property="og:site_name" content={title} />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:image" content="/nobg_hyvnt.png" />
  <meta property="og:image:alt" content="Thought Structure icon" />

  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content={title} />
  <meta name="twitter:description" content={description} />
  <meta name="twitter:image" content="/nobg_hyvnt.png" />
</svelte:head>

<main>
  {@render children?.()}
</main>
