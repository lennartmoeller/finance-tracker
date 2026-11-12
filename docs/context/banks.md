# Banks

## Every bank is one folder that the apps discover

**Id:** d2f8114b-dd33-47e2-bbf3-8f54bf4bff7e
**Type:** decision
**Status:** active
**Evidence:** inferred
**Source:** the empty-house rewrite of 2026-11-11, designed by the coding agent after the target structure of `.claude/skills/empty-house-refactoring/SKILL.md`; not yet confirmed by the maintainer
**See:** ingestion.md#raw-transactions-read-by-their-account — aef5e287-882f-486e-9b4e-37a23394ddea — as of 2026-11-11

Everything bank-specific lives in the bank's folder under `src/shared/banks/`: its name, logo and account number formats, its raw transaction shapes, the adapter the extension runs and the extraction the backend runs.
The apps find the folders by file name, the frontend and the extension through Vite's `import.meta.glob`, the backend and the extension's manifest through `src/shared/discover.ts` in Node, so no app names a bank.

**Reason:** adding, changing or removing a bank is the change the repository sees most, and it touches one folder instead of a shape file in the shared package, an adapter and its entrypoints in the extension, a case in the backend's extraction, an identity function, a logo map, a ranking list and the manifest's permissions.

**Rejected alternative:** an explicit list of banks per app, which keeps literal bank types and needs no discovery, but makes every bank a change in three lists outside its folder.

**Rejected alternative:** one isomorphic module per bank serving all three apps, which needs one list, but bundles adapters and extractions into the frontend and leaks the extension's and Node's types into every app.

**Consequence:** discovery has two mechanisms, because Vite's glob does not exist in Node and the backend runs its TypeScript in Node without a bundler.

**Consequence:** bank names are plain strings in the API contract, so the backend checks a new account's bank, type and number against the bank's declaration instead of the contract's schema.

**Consequence:** the database schema still lists the banks in two checks, so a new bank needs a schema change as well.

## A bank declares only the account types the extension syncs

**Id:** bc02b8d8-1203-472c-970a-f5651ec803a7
**Type:** decision
**Status:** active
**Evidence:** confirmed
**Source:** maintainer decision in a planning dialogue, 2026-11-12
**See:** banks.md#every-bank-is-one-folder-that-the-apps-discover — d2f8114b-dd33-47e2-bbf3-8f54bf4bff7e — as of 2026-11-12

A bank's `bank.ts` declares only the account types the browser extension syncs, so a bank the extension doesn't sync, such as Sparkasse, declares none and has no `adapter.ts`.
That one rule decides three places: `account.create` accepts only a declared type, the popup lists only accounts of a declared type, and the frontend marks only those with a sync's freshness.

**Reason:** a declared type already meant one the extension syncs, as `account.create`'s answer to any other says, so no new field was needed, and an account the extension can't sync shows neither a sync button that fails nor a freshness mark that stays stale.

**Rejected alternative:** Sparkasse declaring a cash account with the IBAN format, plus a new field in `bank.ts` marking banks filled by hand, which lets `account.create` check the IBAN but adds a field for the same effect.

**Rejected alternative:** hiding such an account in the popup only, which leaves the frontend's freshness mark stale for good.

**Consequence:** an account of an undeclared type is inserted into the database by hand, so no app checks its number.
