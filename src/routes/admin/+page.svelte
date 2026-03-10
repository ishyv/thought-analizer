<!-- Admin dashboard — list view. No auth (personal tool). -->
<script lang="ts">
  import { formatRelativeTime } from '$lib/utils/time';

  export let data: {
    analyses: {
      id: string;
      inputText: string;
      extractionQuality: string;
      createdAt: number;
      preview: string;
    }[];
  };
</script>

<div class="admin-shell">
  <header class="top-bar">
    <span class="brand">thought structure</span>
    <div class="separator"></div>
    <span class="section-label">admin</span>
    <div class="spacer"></div>
    <a href="/" class="nav-link">← app</a>
  </header>

  <main class="content">
    {#if data.analyses.length === 0}
      <p class="empty-state">No analyses yet. Submit a thought from the main app to get started.</p>
    {:else}
      <div class="list">
        {#each data.analyses as row}
          <a href="/admin/{row.id}" class="row">
            <span class="timestamp">{formatRelativeTime(row.createdAt)}</span>

            {#if row.extractionQuality === 'partial'}
              <span
                class="quality-badge"
                style="color: var(--amb-text); border-color: var(--amb-border); background: var(--amb-bg);"
              >
                partial
              </span>
            {:else if row.extractionQuality === 'minimal'}
              <span
                class="quality-badge"
                style="color: var(--neg-text); border-color: var(--neg-border); background: var(--neg-bg);"
              >
                minimal
              </span>
            {/if}

            <span class="preview">
              {row.preview}{row.inputText.length > 100 ? '…' : ''}
            </span>

            <span class="chevron">→</span>
          </a>
        {/each}
      </div>
    {/if}
  </main>
</div>

<style>
  .admin-shell {
    min-height: 100dvh;
    color: var(--text-pri);
  }

  .top-bar {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.875rem 2rem;
    border-bottom: 1px solid var(--border);
    background: rgba(9, 11, 13, 0.74);
    backdrop-filter: blur(10px);
  }

  .brand {
    font-family: var(--font-mono);
    font-size: 12px;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--text-pri);
  }

  .separator {
    width: 1px;
    height: 14px;
    background: var(--border);
  }

  .section-label {
    font-family: var(--font-mono);
    font-size: 9px;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--text-sec);
  }

  .spacer {
    flex: 1;
  }

  .nav-link {
    font-family: var(--font-mono);
    font-size: 9px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-sec);
    text-decoration: none;
    transition: color var(--transition-fast);
  }

  .nav-link:hover {
    color: var(--accent-strong);
  }

  .content {
    max-width: 56rem;
    margin: 0 auto;
    padding: 2rem;
  }

  .empty-state {
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-muted);
    text-align: center;
    margin-top: 6rem;
  }

  .list {
    display: flex;
    flex-direction: column;
    gap: 1px;
    background: var(--border);
    border: 1px solid var(--border);
    border-radius: 3px;
    overflow: hidden;
  }

  .row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background: var(--bg);
    text-decoration: none;
    color: inherit;
    transition: background var(--transition-fast);
    cursor: pointer;
  }

  .row:hover {
    background: var(--surface);
  }

  .timestamp {
    font-family: var(--font-mono);
    font-size: 9px;
    letter-spacing: 0.08em;
    color: var(--text-muted);
    white-space: nowrap;
    min-width: 7rem;
  }

  .quality-badge {
    font-family: var(--font-mono);
    font-size: 8px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 1px 5px;
    border: 1px solid;
    border-radius: 2px;
    line-height: 14px;
    white-space: nowrap;
    flex: none;
  }

  .preview {
    font-family: var(--font-body);
    font-size: 13px;
    color: var(--text-sec);
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .chevron {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-muted);
    flex: none;
  }
</style>
