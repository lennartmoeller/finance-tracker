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

[`src/backend/schema.sql`](./src/backend/schema.sql) is the whole schema, triggers included, and PostgreSQL applies it when its container starts on an empty volume.
Until the first release, a schema change edits that file in place, and the first release brings a migration per change instead.

1. Edit `schema.sql`.
2. Back up the local database with `pg_dump`.
3. Bring the local database to the new schema in one hand-written SQL transaction, which keeps its data without re-syncing every account; a renamed table or column also needs `ALTER TABLE … RENAME CONSTRAINT` for each constraint named after it.
4. Check that `pg_dump --schema-only` of the local database equals that of a scratch database built with `psql -f schema.sql`.

## Add a bank

1. Create a folder in [`src/banks/`](./src/banks/) with its `bank.ts`, `adapter.ts`, `extract.ts`, raw transaction shapes, `logo.png` and tests, following [`src/banks/CLAUDE.md`](./src/banks/CLAUDE.md) and the interfaces in [`src/shared/bank.ts`](./src/shared/bank.ts).
2. Add the bank to the checks `accounts_bank_known` and `securities_named_by_known` [in the schema](#change-the-database-schema).
3. Add the bank to the supported accounts in [`README.md`](./README.md) and its adapter to [Ingestion](./docs/contract/ingestion.md#adapters).

Removing a bank deletes its folder, and its entries in those checks once its accounts are deleted and the securities it named are named by another bank.

## Check a change

```sh
# Run the quality gate
pnpm check

# Fix formatting and autofixable lint findings
pnpm exec prettier --write .
pnpm exec eslint --fix .
```

## Release the browser extension

1. Raise `version` in [`src/browser-extension/package.json`](./src/browser-extension/package.json).
2. Run `pnpm --filter @finance-tracker/browser-extension sign` with the addons.mozilla.org API credentials in `WEB_EXT_API_KEY` and `WEB_EXT_API_SECRET`, which signs the build for the unlisted channel.
3. Install the signed file from `src/browser-extension/.output/signed` in Firefox.

## Update dependencies

Dependabot opens weekly pull requests for npm packages, GitHub Actions, the Dockerfile's Node.js image and the Compose images, as [`.github/dependabot.yml`](./.github/dependabot.yml) configures.
Raise [`.nvmrc`](./.nvmrc) together with the Dockerfile's Node.js image, and pnpm in the `packageManager` field of [`package.json`](./package.json) by hand, because Dependabot tracks neither.
