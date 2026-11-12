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

### For development

Development keeps the frontend's dev server and swaps the backend container and the released extension for dev servers that reload on every change.

```sh
# Run PostgreSQL with its schema, and the backend's dev server
docker compose up -d migrate
pnpm --filter @finance-tracker/backend dev

# Open a Firefox with the browser extension loaded until that Firefox closes
pnpm --filter @finance-tracker/browser-extension dev

# Serve the frontend in its mock mode, on generated fake data without backend, with a bar that switches the data state and the theme
pnpm --filter @finance-tracker/frontend mock
```

## Change the database schema

[`src/backend/schema.sql`](./src/backend/schema.sql) is the whole schema, triggers included, and the state every start brings the database to.
Before the backend starts, the `migrate` service plans the difference with pgschema and applies it, unless the plan drops a table, column, sequence, function, procedure or trigger, or changes a column's type.

1. Edit `schema.sql`.
2. Run `docker compose up -d --build`, or `docker compose up -d --build migrate` while [developing](#for-development), which applies every change that loses nothing before the backend starts.
3. If `migrate` refuses the plan, `docker compose logs migrate` shows the refused lines, and the backend container stays stopped:
   1. Back up the database with `docker compose exec -T postgres pg_dump --username postgres postgres > backup.sql`.
   2. Write the change by hand in `change.sql` and run it with `docker compose exec -T postgres psql --username postgres --single-transaction --set ON_ERROR_STOP=1 postgres < change.sql`:
      - A renamed column: `alter table … rename column`, and `alter table … rename constraint` for every constraint named after the column, its `<table>_<column>_not_null` included.
      - A renamed function: `alter function … rename to`.
      - A changed signature of a function that triggers or checks use: drop and create the function together with them.
      - An intended drop or type change: that `drop` or `alter … type` itself.
   3. Repeat step 2, whose plan no longer holds the change.
4. If `migrate` fails on `VALIDATE CONSTRAINT`, existing rows violate the new check, which stays `NOT VALID` until the next start after the rows or `schema.sql` are fixed.
5. After a change by hand, check that `pg_dump --schema-only` of the database equals that of a scratch database built with `psql -f schema.sql`, the only check that sees NOT NULL constraint names, timestamp modifiers and commas in trigger arguments.

## Check a change

```sh
# Run the quality gate
pnpm check

# Fix formatting and autofixable lint findings
pnpm exec prettier --write .
pnpm exec eslint --fix .
```
