# Banks

- Keep everything about one bank in its folder, so that outside `banks/` only `apps/backend/schema.sql` and the documentation name a bank.
- Give each bank `bank.ts`, `adapter.ts` and `extract.ts`, the files the apps discover by name, each with a default export that satisfies its interface in `shared/bank.ts`, and no side effects when imported, because Node imports them to build the manifest.
- Change a bank's export format by adding a shape version, and never edit one that stored raw transactions use.
- Keep directly in `banks/` only what several banks share and what the apps use to find banks and identify their raw transactions, and never import one bank's folder from another.
