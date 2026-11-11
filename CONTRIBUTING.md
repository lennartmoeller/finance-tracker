# Contributing

## Local setup

1. Install the Node.js version in [`.nvmrc`](./.nvmrc), for example with `nvm install` or `fnm install`.
2. Install pnpm with `npm install --global pnpm`; any pnpm version switches itself to the one pinned in the `packageManager` field of [`package.json`](./package.json).
3. Run `pnpm install`.
4. Install a Docker-compatible container runtime with Compose, such as Docker Desktop, or Colima with the standalone `docker-compose`.
5. Copy [`.env.example`](./.env.example) to `.env` and fill in its empty values.
6. Install each Claude Code plugin enabled in [`.claude/settings.json`](./.claude/settings.json) with `claude plugin install <plugin>@<marketplace> --scope project`, because Claude Code enables these plugins for every clone but does not download them.

## Run the system

### For use

```sh
# Start PostgreSQL and the backend on http://localhost:3000
docker compose up -d --build

# Serve the frontend on http://localhost:5173, reading the backend on port 3000
pnpm --filter @finance-tracker/frontend dev

# Fill the prices of the securities held up to yesterday
curl -X POST http://localhost:3000/rpc/price/fill -H "Authorization: Bearer $API_TOKEN" -H 'Content-Type: application/json' -d '{}'
```

Install the browser extension from a [release](#release-the-browser-extension).

### For development

Development keeps the frontend's dev server and swaps the backend container and the released extension for dev servers that reload on every change.

```sh
# Run PostgreSQL alone and the backend's dev server
docker compose up -d postgres
pnpm --filter @finance-tracker/backend dev

# Open a Firefox with the browser extension loaded until that Firefox closes
pnpm --filter @finance-tracker/browser-extension dev

# Serve the frontend in its mock mode, on generated fake data without backend, with a bar that switches the data state and the theme
pnpm --filter @finance-tracker/frontend mock
```

## Change the database schema

A change to the API contract's banks, account types or currency pattern changes the schema too, because [`schema.ts`](./apps/backend/src/schema.ts) builds its constraints from them.
Drizzle's schema holds no triggers, so the migrations carry them as hand-written SQL.

Until the first release, [`0000_init.sql`](./apps/backend/drizzle/0000_init.sql) stays the only migration, and a schema change replaces it:

1. Delete `apps/backend/drizzle` and run `pnpm --filter @finance-tracker/backend exec drizzle-kit generate --name init`.
2. Append the triggers of the previous `0000_init.sql` and restore the previous `when` in `meta/_journal.json`, because the backend applies a migration only when its `when` is newer than that of the last migration it applied.
3. Back up the local database with `pg_dump` and bring it to the new schema in one hand-written SQL transaction, which keeps its data without re-syncing every account.
4. Check that `pg_dump --schema-only` of the local database equals that of a fresh database built from the new migration.

After the first release, add a migration per change with `pnpm --filter @finance-tracker/backend exec drizzle-kit generate --name <change>` instead.

## Check a change

```sh
# Run the quality gate
pnpm check

# Fix formatting and autofixable lint findings
pnpm exec prettier --write .
pnpm exec eslint --fix .
```
