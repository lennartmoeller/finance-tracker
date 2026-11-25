# Contributing

## Setup

Install [mise](https://mise.jdx.dev/getting-started.html), then run `mise trust` and `mise install`.
Run `pnpm install`, install a container runtime with Compose, such as Docker Desktop or Colima with the standalone `docker-compose`, and copy [`.env.example`](./.env.example) to `.env` with its empty values filled in.

## Run locally

### For use

```sh
# Start PostgreSQL, the backend on http://localhost:3000 and the frontend on http://localhost:8080
docker compose up -d --build

# Fill the prices of the securities held up to yesterday
curl -X POST http://localhost:8080/rpc/price/fill -H 'Content-Type: application/json' -d '{}'
```

Install the browser extension from the XPI file of the [latest release](https://github.com/lennartmoeller/finance-tracker/releases/latest) with "Install Add-on From File" in `about:addons`, and connect its popup to `http://localhost:8080`, whose frontend adds the API token itself.

### For development

Development swaps the frontend, the backend container and the released extension for dev servers that reload on every change.

```sh
# Run PostgreSQL with its schema, and the backend's dev server
docker compose up -d migrate
pnpm --filter @finance-tracker/backend dev

# Serve the frontend on http://localhost:5173, reading the backend on port 3000
pnpm --filter @finance-tracker/frontend dev

# Open a Firefox with the browser extension loaded until that Firefox closes
pnpm --filter @finance-tracker/browser-extension dev

# Serve the frontend in its mock mode, on generated fake data without backend, with a bar that switches the data state and the theme
pnpm --filter @finance-tracker/frontend mock
```

## Change the database schema

[`src/backend/schema.sql`](./src/backend/schema.sql) is the whole schema, triggers included, and the state every start brings the database to.
Before the backend starts, the migrate step plans the difference with pgschema and applies it, unless the plan drops a table, column, sequence, function, procedure or trigger, or changes a column's type.

1. Edit `schema.sql`.
2. Run `docker compose up -d --build`, or `docker compose up -d --build migrate` while [developing](#for-development), which applies every change that loses nothing before the backend starts.
3. If the migrate step refuses the plan, the backend stays stopped, and the step's log shows the refused lines: `docker compose logs migrate`, or in the [cluster](./docs/contract/hosting.md) `kubectl logs --namespace finance-tracker deployment/backend --container migrate`.
   Run the following commands in PostgreSQL's container, prefixed with `docker compose exec -T postgres`, or in the cluster with `kubectl exec --stdin --namespace finance-tracker postgres-0 --`:
   1. Back up the database with `pg_dump --username postgres postgres > backup.sql`.
   2. Write the change by hand in `change.sql` and run it with `psql --username postgres --single-transaction --set ON_ERROR_STOP=1 postgres < change.sql`:
      - A renamed column: `alter table … rename column`, and `alter table … rename constraint` for every constraint named after the column, its `<table>_<column>_not_null` included.
      - A renamed function: `alter function … rename to`.
      - A changed signature of a function that triggers or checks use: drop and create the function together with them.
      - An intended drop or type change: that `drop` or `alter … type` itself.
   3. With Compose, repeat step 2, whose plan no longer holds the change; in the cluster, the backend's init container retries by itself and starts the backend once the plan passes.
4. If the migrate step fails on `VALIDATE CONSTRAINT`, existing rows violate the new check, which stays `NOT VALID` until the next start after the rows or `schema.sql` are fixed.
5. After a change by hand, check that `pg_dump --schema-only` of the database equals that of a scratch database built with `psql -f schema.sql`, the only check that sees NOT NULL constraint names, timestamp modifiers and commas in trigger arguments.

## Check

Run `mise run check`, which CI runs as the `Quality` check on every pull request.
CI also builds both images, as the `Images` checks.
Run `pnpm exec prettier --write .` and `pnpm exec eslint --fix .` to fix formatting and autofixable lint findings.

## Release

Title pull requests as [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/), whose types set the [next version](https://github.com/lennartmoeller/release-from-conventional-commits#how-the-version-is-calculated).
Run the `Release` workflow on `main` to release it.
A release also publishes the backend and frontend images, the Helm chart and the browser extension under that version, and addons.mozilla.org signs the extension with the API key in the Actions secrets `WEB_EXT_API_KEY` and `WEB_EXT_API_SECRET`.
