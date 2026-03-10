# Thought Structure

Thought Structure is a small SvelteKit app for turning messy writing into visible reasoning. Paste a thought, then inspect phrase highlights, statement roles, relationships, tensions, and structural issues without the UI turning into dashboard sludge.

## Run

```sh
npm install
npm run dev
```

## Build

```sh
npm run build
npm run preview
```

## Database Storage

The app uses SQLite via `better-sqlite3`.

- Local development defaults to `db/thought-structure.db`.
- Vercel defaults to `/tmp/thought-structure.db`, because the deployed bundle directory is read-only.
- Set `DATABASE_PATH` to override the SQLite location in any environment.

On Vercel, `/tmp` is ephemeral storage. Analyses written there are not durable across cold starts or deployments.
