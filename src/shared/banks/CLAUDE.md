# Banks

- Keep everything about one bank in its folder, so that adding or removing a bank changes nothing outside `src/shared/banks/` but the checks in `src/backend/schema.sql` and the documentation.
- Give each bank `bank.ts` and `extract.ts`, `adapter.ts` only if the extension syncs it, and `export-file.ts` only if the user can upload its export, the files the apps discover by name, each with a default export that satisfies its interface in `src/shared/bank.ts`, and no side effects when imported, because Node imports them to build the manifest.
- Declare in `bank.ts` only the account types the extension syncs or the user uploads, because `account.create` and the frontend's freshness dot read a declared type as one, while the popup lists only banks with an adapter.
- Change a bank's export structure by adding a shape version, and widen a shape version only to accept values it has not seen, never in a way that reads its stored rows differently.
- Keep only bank folders in `src/shared/banks/`, and never import one bank's folder from another.
