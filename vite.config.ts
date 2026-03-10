import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
  ssr: {
    // @dagrejs/dagre ships ESM-only. Without this, Vite leaves it as an
    // external require() in the SSR bundle, which crashes in the Vercel
    // Node.js serverless runtime (CJS loader). Inlining it lets Vite
    // transform the ESM syntax before the bundle is written.
    noExternal: ['@dagrejs/dagre']
  }
});
