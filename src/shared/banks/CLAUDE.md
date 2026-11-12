# Banks

- Keep everything about one bank in its folder, so that adding or removing a bank changes nothing outside `src/shared/banks/` but the checks in `src/backend/schema.sql` and the documentation.
- Give each bank `bank.ts`, `adapter.ts` and `extract.ts`, the files the apps discover by name, each with a default export that satisfies its interface in `src/shared/bank.ts`, and no side effects when imported, because Node imports them to build the manifest.
- Change a bank's export format by adding a shape version, and never edit one that stored raw transactions use.
- Keep only bank folders in `src/shared/banks/`, and never import one bank's folder from another.
