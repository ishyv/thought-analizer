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

## Abuse Controls

The extraction endpoint applies server-side abuse limits by anonymous client fingerprint.

Default behavior:

- Reject inputs longer than `6000` characters
- Charge `1` token per `1500` characters, capped at `4` tokens per request
- Allow `12` tokens per rolling hour
- Allow `40` tokens per rolling 24 hours

Override with environment variables:

- `EXTRACT_MAX_INPUT_CHARS`
- `EXTRACT_RATE_LIMIT_CHARS_PER_TOKEN`
- `EXTRACT_RATE_LIMIT_MAX_REQUEST_COST`
- `EXTRACT_RATE_LIMIT_HOURLY_TOKENS`
- `EXTRACT_RATE_LIMIT_DAILY_TOKENS`
