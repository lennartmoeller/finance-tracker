# Database

## The schema is one SQL file without an ORM

**Id:** 81078cce-7b4b-46fe-8199-591d500749bc
**Type:** decision
**Status:** active
**Evidence:** inferred
**Source:** the empty-house rewrite of 2026-11-11, designed by the coding agent; not yet confirmed by the maintainer
**Revisit when:** the system has its first release, which needs a migration per schema change
**See:** transactions.md#normalized-transactions-per-account-type-checked-by-the-database — 1c839c68-8767-49ee-ad4c-20216776c3a7 — as of 2026-11-11

`src/backend/schema.sql` holds the whole schema, its triggers included, the PostgreSQL container applies it to an empty volume, and the backend queries the database in plain SQL through `pg`.

**Reason:** the database enforces the data's rules by checks and triggers, which SQL states directly, while Drizzle's schema could hold no trigger, so its migrations carried hand-appended SQL beside a generated snapshot and journal, and every pre-release schema change regenerated them and restored a timestamp by hand.

**Rejected alternative:** Drizzle ORM and drizzle-kit, as the original had them, which type query results but keep three copies of the schema and cannot express its triggers.

**Rejected alternative:** a migration runner in the backend before the first release, while the schema is replaced in place and the local database migrated by hand anyway.

**Consequence:** query results are typed by hand, so a wrong column alias surfaces when oRPC validates the procedure's output, and the test suite, which runs without a database, catches none.

**Consequence:** a database other than the Compose volume, such as a scratch copy, gets its schema from `psql -f schema.sql`.
