# Change the database schema by hand

Before the backend starts, the migrate step plans the difference to [`src/backend/schema.sql`](../src/backend/schema.sql) with pgschema and applies it, unless the plan drops a table, column, sequence, function, procedure or trigger, or changes a column's type.
A change the plan refuses runs by hand first:

1. If the migrate step refuses the plan, the backend stays stopped, and the step's log shows the refused lines: `docker compose logs migrate`, or in the [cluster](./contract/hosting.md) `kubectl logs --namespace finance-tracker deployment/backend --container migrate`.
   Run the following commands in PostgreSQL's container, prefixed with `docker compose exec -T postgres`, or in the cluster with `kubectl exec --stdin --namespace finance-tracker postgres-0 --`:
   1. Back up the database with `pg_dump --username postgres postgres > backup.sql`.
   2. Write the change by hand in `change.sql` and run it with `psql --username postgres --single-transaction --set ON_ERROR_STOP=1 postgres < change.sql`:
      - A renamed column: `alter table … rename column`, and `alter table … rename constraint` for every constraint named after the column, its `<table>_<column>_not_null` included.
      - A renamed function: `alter function … rename to`.
      - A changed signature of a function that triggers or checks use: drop and create the function together with them.
      - An intended drop or type change: that `drop` or `alter … type` itself.
   3. With Compose, run `docker compose up -d --build` again, whose plan no longer holds the change; in the cluster, the backend's init container retries by itself and starts the backend once the plan passes.
2. If the migrate step fails on `VALIDATE CONSTRAINT`, existing rows violate the new check, which stays `NOT VALID` until the next start after the rows or `schema.sql` are fixed.
3. After a change by hand, check that `pg_dump --schema-only` of the database equals that of a scratch database built with `psql -f schema.sql`, the only check that sees NOT NULL constraint names, timestamp modifiers and commas in trigger arguments.
