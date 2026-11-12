# Banks

- Keep everything about one bank in its folder, so that adding or removing a bank changes nothing outside `src/shared/banks/` but the checks in `src/backend/schema.sql` and the documentation.
- Give each bank `bank.ts` and `extract.ts`, and `adapter.ts` only if the extension syncs it, the files the apps discover by name, each with a default export that satisfies its interface in `src/shared/bank.ts`, and no side effects when imported, because Node imports them to build the manifest.
- Declare in `bank.ts` only the account types the extension syncs, because `account.create`, the popup and the frontend's freshness dot read a declared type as one.
- Change a bank's export format by adding a shape version, and never edit one that stored raw transactions use.
- Keep only bank folders in `src/shared/banks/`, and never import one bank's folder from another.
