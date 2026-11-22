# Contributing

## Local setup

1. Install [mise](https://mise.jdx.dev/getting-started.html), and run `mise trust` and `mise install` to install Node.js, pnpm and Helm in the versions [`mise.toml`](./mise.toml) pins; pnpm switches itself to the version in the `packageManager` field of [`package.json`](./package.json).
2. Run `pnpm install`.
3. Install a Docker-compatible container runtime with Compose, such as Docker Desktop, or Colima with the standalone `docker-compose`.
4. Copy [`.env.example`](./.env.example) to `.env` and fill in its empty values.
5. Install each Claude Code plugin enabled in [`.claude/settings.json`](./.claude/settings.json) with `claude plugin install <plugin>@<marketplace> --scope project`, because Claude Code enables these plugins for every clone but does not download them.

## Run the system

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

## Check a change

```sh
# Run the quality gate, which CI runs as the required Quality check on every pull request
mise run check

# Fix formatting and autofixable lint findings
pnpm exec prettier --write .
pnpm exec eslint --fix .
```

CI also builds both images, as the required `Images` checks.

## Release

Every merge to `main` releases the backend and frontend images, the Helm chart and the signed browser extension under one version, which [`next-version`](https://github.com/lennartmoeller/next-version) computes from the last `v*` tag and the pull request title in [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) form: `!` before the colon bumps the major version, `feat` the minor version, and every other type the patch version.
[`release.yml`](./.github/workflows/release.yml) writes that version into [`chart/Chart.yaml`](./chart/Chart.yaml) and the extension's [`package.json`](./src/browser-extension/package.json), commits and tags it, and builds every artifact from the tag, so a change never sets these versions by hand.
The workflow signs the extension with an addons.mozilla.org API key, kept in the Actions secrets `WEB_EXT_API_KEY` and `WEB_EXT_API_SECRET`.
