# Database

## The schema is one SQL file without an ORM

**Id:** 81078cce-7b4b-46fe-8199-591d500749bc
**Type:** decision
**Status:** active
**Evidence:** confirmed
**Source:** the empty-house rewrite of 2026-11-11, designed by the coding agent; confirmed by the maintainer on 2026-11-12 after a re-check against Drizzle's 1.0 release candidate
**Revisit when:** a TypeScript ORM defines triggers and their functions in its schema
**See:** transactions.md#normalized-transactions-per-account-type-checked-by-the-database — 1c839c68-8767-49ee-ad4c-20216776c3a7 — as of 2026-11-11

`src/backend/schema.sql` holds the whole schema, its triggers included, and the backend queries the database in plain SQL through `pg`.

**Reason:** the database enforces the data's rules by checks and triggers, which SQL states directly, while Drizzle's schema could hold no trigger, so its migrations carried hand-appended SQL beside a generated snapshot and journal, and every pre-release schema change regenerated them and restored a timestamp by hand.
Drizzle's 1.0 release candidate fixes the journal but still defines no trigger or function.

**Rejected alternative:** Drizzle ORM and drizzle-kit, as the original had them, which type query results but keep three copies of the schema and cannot express its triggers.

**Rejected alternative:** query result types checked against the schema, by SafeQL linting every query against a database loaded from `schema.sql`, or by Kanel generating row types from it; SafeQL costs every query a tagged template, five dev dependencies and a database for each ESLint run, Kanel a third copy of the schema that still misses wrong aliases, and both save only a few lines of types.

**Consequence:** query results are typed by hand, so a wrong column alias surfaces when oRPC validates the procedure's output, and the test suite, which runs without a database, catches none.

## pgschema brings the database to `schema.sql` before the backend starts

**Id:** 394c5719-fa83-4862-a00a-a71b972bebc3
**Type:** decision
**Status:** active
**Evidence:** confirmed
**Source:** maintainer decision of 2026-11-12, after a market scan and hands-on probes of the shortlist against PostgreSQL 18.6
**Revisit when:** pgschema can rename a column, or a stable diff tool that refuses data loss by itself can read this schema back from a database
**See:** database.md#the-schema-is-one-sql-file-without-an-orm — 81078cce-7b4b-46fe-8199-591d500749bc — as of 2026-11-12

The backend's image carries pgschema, and the `migrate` step runs `src/backend/migrate.ts` before the backend starts: pgschema plans the difference between `schema.sql` and the database in a database of its own, `pgschema_plan`, and the wrapper refuses a plan that drops a table, column, sequence, function, procedure or trigger or changes a column's type, and otherwise applies pgschema's plan unchanged.
What the wrapper refuses, the maintainer runs by hand first, as [`CONTRIBUTING.md`](../../CONTRIBUTING.md#change-the-database-schema) describes.

**Reason:** the maintainer edits one definition of the schema and wants the system to build a new database and bring an existing one up to date by itself, without migration files or a prompt; pgschema is the only stable, free diff tool that reads this schema back from a database.

**Reason:** pgschema applies whatever it plans and has no rename, so a renamed column plans as drop and add and loses its values; the gate refuses every plan that loses data or a guarantee before anything changes.

**Reason:** planning executes `schema.sql`, and with the target as plan database it ran there, where an idempotent `drop function if exists … cascade` dropped live triggers before any approval.

**Reason:** `schema.sql` reaches pgschema through the image, because Colima's virtiofs served a bind-mounted file truncated or missing for a few seconds after a save; it keeps `begin;` and `commit;`, so a truncated read fails to parse or, without its final `commit;`, plans dropping every table, which the gate refuses.

**Rejected alternative:** a TypeScript ORM or schema toolkit that generates the migrations, re-evaluated on 2026-11-12 with MikroORM 7.2, Orchid 1.78, Drizzle 1.0 RC and Prisma 8 RC: none defines the triggers natively with shared functions, `tg_argv`, `update of` and `when`; MikroORM came closest but keeps them as raw strings, misses check edits that change only case or parentheses, and grows the owned code from 282 to 465 lines plus a 1,114-line snapshot, and Orchid's generator failed on five bugs.

**Rejected alternative:** migration files that pgschema writes and dbmate applies, a reviewed and replayable history that costs a file per change and a second copy of the schema, and pays off only with several databases.

**Rejected alternative:** pgschema's typed approval of every change, which has no gate, empties a renamed column after one careless `yes`, and cannot prompt in a k3s init container.

**Rejected alternative:** a mode of the wrapper that applies a refused plan after a typed `yes`, a second code path for a rare case that the change by hand covers.

**Rejected alternative:** merging pgschema's transaction groups into one, so that a failing validation rolls back the whole plan; it rewrites the tool's plan, ties the wrapper to pgschema's plan format and needs a re-check on every upgrade, for a rare failure that loses no data.

**Rejected alternative:** pg-delta, which refuses data loss by itself, renames on confirmation and rolls a failed plan back whole, but is an alpha release, and the maintainer allows only tools with a stable release line.

**Rejected alternative:** psqldef, whose grammar reserves `identity`, so it cannot read back a table with a column of that name and only diffs two files.

**Rejected alternative:** Atlas, which handles triggers and functions only in its paid edition.

**Consequence:** a changed check or foreign key applies as `ADD … NOT VALID` and a separate `VALIDATE`, so when existing rows violate it, the change stays half applied, checking only new rows, until the next start after the fix.

**Consequence:** after a refusal or a failure, the backend container stays stopped until the next successful start.

**Consequence:** pgschema takes no lock, so the backend runs as one replica, or the step as a k3s `Job` before it.

**Consequence:** pgschema overlooks NOT NULL constraint names, timestamp modifiers and commas in trigger arguments, so after a change by hand the schema dump is compared with that of a `psql -f schema.sql` build.

**Consequence:** the role in `DATABASE_URL` needs the right to create a database, for `pgschema_plan`.
